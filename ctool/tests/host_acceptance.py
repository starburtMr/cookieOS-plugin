"""Run Ctool's final ZIP against cookieOS's disposable integration fixture."""
import argparse
import hashlib
import hmac
import http.server
import importlib.util
import json
import subprocess
from pathlib import Path
import sys
import threading
import urllib.request
import uuid
import zipfile


def load_checks(root):
    scripts = root / "cookieOS/server/scripts"
    sys.path.insert(0, str(scripts))
    spec = importlib.util.spec_from_file_location("extension_checks", scripts / "check-extensions.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Model(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        messages = body["messages"]
        if not body.get("stream"):
            payload = {"choices": [{"message": {"role": "assistant", "content": "OK"}}]}
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode())
            return
        tools = body.get("tools", [])
        name = next((t["function"]["name"] for t in tools if t["function"]["name"].endswith("__base32_transform")), None)
        last_user = max((i for i, m in enumerate(messages) if m["role"] == "user"), default=-1)
        if any(m["role"] == "tool" for m in messages[last_user:]) or not tools:
            delta = {"content": "fixture model result"}
        else:
            name = name or next(t["function"]["name"] for t in tools if t["function"]["name"] == "cookieos_connection_test")
            args = {"text": "foo", "operation": "encode"} if name.endswith("__base32_transform") else {}
            delta = {"tool_calls": [{"index": 0, "id": "ctool-fixture", "function": {"name": name, "arguments": json.dumps(args)}}]}
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        payload = {"choices": [{"delta": delta}]}
        try:
            self.wfile.write(("data: " + json.dumps(payload) + "\n\ndata: [DONE]\n\n").encode())
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", action="store_true")
    parser.add_argument("--cookieos-root", type=Path, required=True)
    parser.add_argument("--server-binary", type=Path, required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--previous", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root, archive, previous, output, binary = (p.resolve() for p in (args.cookieos_root, args.archive, args.previous, args.output, args.server_binary))
    if output.exists():
        raise ValueError("Output must not already exist")
    test_root = Path(__file__).resolve().parent
    host = load_checks(root)
    report = {"version": "0.3.0", "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "hostSha256": hashlib.sha256(binary.read_bytes()).hexdigest(), "passed": [], "unverified": ["real external model provider", "JDoodle credentials and paid execution", "ARM/GeoJS live availability", "other OS/CPU/libc", "formal market publication"]}

    def passed(name):
        report["passed"].append(name)
        print("PASS", name, flush=True)

    try:
        with host.RemoteFixture("ctool-full", server_binary=binary) as fixture:
            ui_origin = "http://127.0.0.1:" + str(fixture.port("127.0.0.1"))
            if args.browser:
                fixture.browser_origin = ui_origin
                fixture.env["COOKIEOS_BROWSER_ORIGIN"] = ui_origin
            fixture.start("#!/usr/bin/env python3\nraise SystemExit(2)\n")
            checks = host.Checks(fixture)
            checks.api("PUT", "/extensions/settings", {"runtime_strategy": "system"})
            old = checks.upload(previous)
            eid = old["extensionId"]
            old_digest = checks.read(eid)["digest"]
            checks.patch(eid, {"config": {"retained": True}, "secretConfig": {"keys": {"fixture": "fixture-key"}}})
            checks.api("PUT", "/extensions/" + eid + "/storage", {"action": "set", "key": "ctool.pref.fixture", "value": "retained", "digest": checks.read(eid)["digest"]})
            installed = checks.upload(archive)
            assert installed["extensionId"] == eid
            assert checks.read(eid)["manifest"]["version"] == "0.3.0"
            assert checks.read(eid)["config"] == {"retained": True}
            assert checks.api("GET", "/extensions/" + eid + "/storage")["ctool.pref.fixture"] == "retained"
            assert checks.read(eid)["hasSecretConfig"]
            passed("0.2.0 upgrade preserves identity, config, secret config and storage")
            presentation = checks.api("GET", "/extensions/" + eid + "/presentation")
            assert presentation["status"] == "available" and presentation["digest"] == report["sha256"]
            assert len(presentation["presentation"]["screenshots"]) == 3
            for url in [presentation["presentation"]["icon"], *[s["url"] for s in presentation["presentation"]["screenshots"]]]:
                with urllib.request.urlopen(urllib.request.Request(fixture.origin + url, headers={"Cookie": fixture.cookie}), timeout=10) as response:
                    assert response.status == 200 and response.headers["Content-Type"].startswith("image/")
            passed("installed presentation and authenticated packaged images match final ZIP")

            def invoke(tool, params):
                result = checks.invoke(eid, tool, params)
                assert result.get("ok", result.get("state") == "succeeded"), (tool, result)
                return result["result"]

            assert invoke("base32_transform", {"text": "foo", "operation": "encode"})["text"] == "MZXW6==="
            assert invoke("json_transform", {"text": '{"a":2}', "expression": "_.mapValues(data,x=>x*3)"})["text"] == '{"value":{"a":6}}'
            assert invoke("hmac_compute", {"text": "abc", "algorithm": "sha256", "keyRef": "fixture"})["text"] == hmac.new(b"fixture-key", b"abc", hashlib.sha256).hexdigest()
            qr = invoke("qrcode_generate", {"text": "cookieOS 中文", "size": 600})
            assert invoke("qrcode_read", {"fileRef": qr["file"]["fileRef"]})["text"] == "cookieOS 中文"
            passed("real installed Node service runs shared codecs, QuickJS and native QR")
            checks.patch(eid, {"aiEnabled": True, "mcpEnabled": True})
            service = checks.api("POST", "/mcp-services", {"name": "Ctool isolated", "enabled": True, "extensionIds": [eid], "toolNames": []}, 201)["id"]
            token = checks.api("POST", "/mcp-services/" + service + "/tokens", {"name": "fixture", "expiresDays": 1}, 201)
            hello = checks.mcp(service, token["token"], "initialize", {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "Ctool fixture", "version": "1"}})
            assert "result" in hello
            listing = checks.mcp(service, token["token"], "tools/list")["result"]
            tools = listing["tools"]
            while listing.get("nextCursor"):
                listing = checks.mcp(service, token["token"], "tools/list", {"cursor": listing["nextCursor"]})["result"]
                tools.extend(listing["tools"])
            with zipfile.ZipFile(archive) as package:
                names = {t["name"] for t in json.loads(package.read("manifest.json"))["tools"]}
            assert len(tools) == len(names) == 100
            name_map = {n: next(t["name"] for t in tools if t["name"].endswith("__" + n)) for n in names}

            def mcp(tool, params):
                result = checks.mcp(service, token["token"], "tools/call", {"name": name_map[tool], "arguments": params})["result"]
                assert not result.get("isError", False), (tool, result)
                return result["structuredContent"]

            assert mcp("base32_transform", {"text": "foo", "operation": "encode"})["text"] == "MZXW6==="
            data = "MCP 文件中文".encode()
            sha = hashlib.sha256(data).hexdigest()
            ref = mcp("file_begin", {"size": len(data), "sha256": sha})["fileRef"]
            import base64
            mcp("file_chunk", {"fileRef": ref, "offset": 0, "dataBase64": base64.b64encode(data).decode()})
            mcp("file_commit", {"fileRef": ref})
            assert mcp("hash_compute", {"fileRef": ref, "algorithm": "sha256"})["text"] == sha
            assert base64.b64decode(mcp("file_read", {"fileRef": ref, "offset": 0})["dataBase64"]) == data
            mcp("file_delete", {"fileRef": ref})
            passed("real MCP discovers all 100 tools and executes codec/file/hash round trip")

            model = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Model)
            thread = threading.Thread(target=model.serve_forever, daemon=True)
            thread.start()
            try:
                provider = checks.api("POST", "/model-providers", {"name": "Ctool fixture", "baseUrl": "http://127.0.0.1:" + str(model.server_port), "apiKey": "test-key", "local": True, "enabled": True, "configuredModels": ["fixture-model"]}, 201, **{"Idempotency-Key": str(uuid.uuid4())})
                checks.api("POST", "/model-providers/" + provider["id"] + "/verification", {"model": "fixture-model", "tools": True}, **{"Idempotency-Key": str(uuid.uuid4()), "If-Match": '"' + str(provider["version"]) + '"'})
                settings = checks.api("GET", "/assistant/settings")
                checks.api("PUT", "/assistant/model-selection", {"providerId": provider["id"], "model": "fixture-model", "version": settings["version"], "toolsEnabled": True})
                start = json.loads(mcp("ai_assist", {"feature": "text_process", "text": "fixture input"})["text"])
                status = host.wait_for(lambda: json.loads(mcp("ai_call_status", {"callId": start["callId"]})["text"]), lambda r: r["status"] not in ("prepared", "queued", "running"))
                assert status["status"] == "completed" and status["text"] == "fixture model result", status
                chat = checks.api("POST", "/assistant/conversations", status=201)["id"]
                prefs = checks.api("GET", "/assistant/conversations/" + chat + "/preferences")
                turn = checks.api("POST", "/assistant/conversations/" + chat + "/messages", {"message": "编码 foo", "expectedProviderVersion": prefs["providerVersion"]}, 202, **{"Idempotency-Key": str(uuid.uuid4()), "If-Match": '"' + str(prefs["version"]) + '"'})["id"]
                done = host.wait_for(lambda: checks.api("GET", "/assistant/turns/" + turn), lambda t: t["state"] not in ("queued", "running"))
                assert done["state"] == "succeeded", done
                assert any(e.get("type") == "tool" and e.get("state") == "succeeded" and "MZXW6===" in json.dumps(e) for e in done["events"]), done
                passed("real host model bridge and built-in AI dispatcher use the same installed tools (local protocol model)")
                if args.browser:
                    browser_config = fixture.directory / "browser.json"
                    browser_config.touch(mode=0o600)
                    browser_config.write_text(json.dumps({"origin": ui_origin, "apiOrigin": fixture.origin, "uiRoot": str(root / "cookieOS/web/apps/web-antd/dist"), "cookie": fixture.cookie, "extensionId": eid, "output": str(output.parent / "host-browser")}))
                    subprocess.run(["node", str(test_root / "host-browser.mjs"), str(browser_config)], cwd=test_root.parent, check=True, timeout=180)
                    passed("real host frontend: four UI surfaces, model action and three viewport sizes")
            finally:
                model.shutdown()
                model.server_close()
                thread.join(timeout=5)

            checks.patch(eid, {"enabled": False})
            assert checks.api("GET", "/extensions/" + eid + "/presentation")["status"] == "available"
            checks.patch(eid, {"enabled": True})
            assert invoke("text_operate", {"text": "abc", "operation": "upper"})["text"] == "ABC"
            assert checks.invoke(eid, "file_status", {"fileRef": qr["file"]["fileRef"]}, status=502)["error"]["code"] == "extension_tool_failed"
            passed("disable/enable preserves presentation and expires temporary file references")
            bad = fixture.directory / "invalid.zip"
            with zipfile.ZipFile(archive) as source, zipfile.ZipFile(bad, "w", zipfile.ZIP_DEFLATED) as dest:
                for entry in source.infolist():
                    dest.writestr(entry.filename, b'{"schemaVersion":1,"unknown":true}' if entry.filename == "metadata.json" else source.read(entry))
            checks.upload(bad, expected="failed")
            assert checks.read(eid)["digest"] == report["sha256"]
            assert invoke("base32_transform", {"text": "foo", "operation": "encode"})["text"] == "MZXW6==="
            passed("invalid presentation package cannot replace or break current version")
            current = checks.read(eid)
            checks.api("POST", "/extensions/" + eid + "/rollback", {"digest": old_digest}, **{"If-Match": '"' + str(current["version"]) + '"'})
            assert checks.read(eid)["manifest"]["version"] == "0.2.0"
            assert checks.read(eid)["config"] == {"retained": True}
            assert invoke("json_format", {"text": '{"a":1}', "indent": 0})["text"] == '{"a":1}'
            checks.upload(archive)
            current = checks.read(eid)
            checks.api("DELETE", "/extensions/" + eid + "?delete_data=false", **{"If-Match": '"' + str(current["version"]) + '"'})
            checks.upload(archive)
            assert checks.read(eid)["config"] == {"retained": True}
            assert checks.api("GET", "/extensions/" + eid + "/storage")["ctool.pref.fixture"] == "retained"
            assert invoke("hmac_compute", {"text": "abc", "algorithm": "sha256", "keyRef": "fixture"})["text"] == hmac.new(b"fixture-key", b"abc", hashlib.sha256).hexdigest()
            checks.api("DELETE", "/mcp-tokens/" + token["id"])
            passed("rollback to immutable 0.2.0, upgrade again and retained-data reinstall work")
        passed("owned fixture processes, ports, database container and temporary data cleaned")
    finally:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
