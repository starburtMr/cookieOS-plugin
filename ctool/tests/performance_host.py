"""Measure an immutable plugin ZIP in a disposable real cookieOS fixture."""
import argparse
import hashlib
import platform
import signal
import json
from pathlib import Path
import subprocess
from host_acceptance import load_checks

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--cookieos-root', type=Path, required=True)
p.add_argument('--server-binary', type=Path, required=True)
p.add_argument('--archive', type=Path, required=True)
p.add_argument('--frontend-root', type=Path, help='Frozen existing host frontend dist for comparable runs')
p.add_argument('--output', type=Path, required=True)
p.add_argument('--group', choices=['all','opens','base64/encoder','json','code','unit','numberCalc','diffs'], default='all')
a = p.parse_args()
root, binary, archive, output = (v.resolve() for v in (a.cookieos_root, a.server_binary, a.archive, a.output))
frontend = a.frontend_root.resolve() if a.frontend_root else root / 'cookieOS/web/apps/web-antd/dist'
output.mkdir(parents=True, exist_ok=False)
tests = Path(__file__).resolve().parent
def interrupted(_signum, _frame):
    raise KeyboardInterrupt('Performance sampling interrupted')
signal.signal(signal.SIGTERM, interrupted)
host = load_checks(root)
with host.RemoteFixture('ctool-perf', server_binary=binary) as f:
    ui = 'http://127.0.0.1:' + str(f.port('127.0.0.1'))
    f.browser_origin = ui
    f.env['COOKIEOS_BROWSER_ORIGIN'] = ui
    f.start('#!/usr/bin/env python3\nraise SystemExit(2)\n')
    c = host.Checks(f)
    c.api('PUT', '/extensions/settings', {'runtime_strategy': 'system'})
    eid = c.upload(archive)['extensionId']
    for key, value in [('locale', 'zh_CN'), ('auto_save_copy', False)]:
        c.api('PUT', '/extensions/' + eid + '/storage', {'action': 'set', 'key': 'ctool.pref.' + key, 'value': value, 'digest': c.read(eid)['digest']})
    config = f.directory / 'performance.json'
    config.touch(mode=0o600)
    config.write_text(json.dumps({'origin': ui, 'apiOrigin': f.origin, 'cookie': f.cookie, 'extensionId': eid,
                                 'uiRoot': str(frontend), 'output': str(output),
                                 'archive': str(archive), 'group': a.group}))
    host_sha = hashlib.sha256(Path('/proc/' + str(f.processes[-1].pid) + '/exe').read_bytes()).hexdigest()
    ui_sha = hashlib.sha256((frontend / 'index.html').read_bytes()).hexdigest()
    subprocess.run(['node', str(tests / 'performance.mjs'), str(config)], cwd=tests.parent, check=True, timeout=900)
    report_file = output / 'performance.json'
    report = json.loads(report_file.read_text())
    report.update(hostSha256=host_sha, hostFrontendIndexSha256=ui_sha, platform=platform.platform())
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('PASS isolated performance fixture cleaned', flush=True)
