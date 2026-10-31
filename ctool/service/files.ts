import {Buffer} from "node:buffer";
import {randomBytes, createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, lstatSync, readdirSync, writeFileSync, readFileSync, appendFileSync, openSync, readSync, closeSync, rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {ToolError} from "ctool-tools";

export const CHUNK_BYTES = 49152;
export const INPUT_BYTES = 8 * 1024 * 1024;
export const OUTPUT_BYTES = 16 * 1024 * 1024;
const TTL = 15 * 60 * 1000;
const refPattern = /^[\w-]{43}$/;
type Entry = {fileRef: string; size: number; sha256: string; mime: string; expiresAt: number; received: number; ready: boolean};
export type FileInfo = Pick<Entry, "fileRef" | "size" | "sha256" | "mime" | "expiresAt">;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export class FileStore {
    private entries = new Map<string, Entry>();
    private total = 0;
    private root: string;
    private timer: ReturnType<typeof setInterval>;
    constructor(dataDir = tmpdir()) {
        mkdirSync(dataDir, {recursive: true});
        if (!lstatSync(dataDir).isDirectory() || lstatSync(dataDir).isSymbolicLink()) throw new Error("Invalid extension data directory");
        for(const name of readdirSync(dataDir)) {
            const match=/^ctool-files-(\d+)-[a-zA-Z0-9]+$/.exec(name);if(!match)continue;
            try {
                const directory=join(dataDir,name);const stat=lstatSync(directory);
                if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.())continue;
                const marker=join(directory,".owner.json");if(lstatSync(marker).isSymbolicLink())continue;
                const owner=JSON.parse(readFileSync(marker,"utf8"));
                if(owner.version!==1||owner.pid!==Number(match[1])||typeof owner.createdAt!=="number"||Date.now()-owner.createdAt<TTL)continue;
                try{process.kill(owner.pid,0);}catch(error){if((error as NodeJS.ErrnoException).code==="ESRCH")rmSync(directory,{recursive:true,force:true});}
            }catch{/* Unrecognized directories belong to someone else. */}
        }
        this.root = mkdtempSync(join(dataDir, `ctool-files-${process.pid}-`));
        writeFileSync(join(this.root,".owner.json"),JSON.stringify({version:1,pid:process.pid,createdAt:Date.now()}),{mode:0o600,flag:"wx"});
        this.timer = setInterval(() => this.sweep(), 60000); this.timer.unref();
    }
    private sweep() {
        for (const entry of this.entries.values()) if (entry.expiresAt < Date.now()) this.remove(entry.fileRef);
    }
    private get(fileRef: string, ready = false) {
        const entry = refPattern.test(fileRef) ? this.entries.get(fileRef) : undefined;
        if (!entry || entry.expiresAt < Date.now()) {
            if (entry) this.remove(fileRef);
            throw new ToolError("resource_expired", "文件不存在或已过期，请重新上传");
        }
        if (ready && !entry.ready) throw new ToolError("file_incomplete", "文件尚未上传完成");
        if (lstatSync(join(this.root, fileRef)).isSymbolicLink()) throw new ToolError("invalid_file", "文件不可读取");
        entry.expiresAt = Date.now() + TTL;
        return entry;
    }
    begin(size: number, sha256: string, mime = "application/octet-stream", output = false): FileInfo {
        this.sweep();
        if (!Number.isSafeInteger(size) || size < 0 || size > (output ? OUTPUT_BYTES : INPUT_BYTES)) throw new ToolError("input_limit", "文件超过大小上限");
        if (!/^[a-f0-9]{64}$/.test(sha256)) throw new ToolError("invalid_arguments", "文件摘要格式不正确");
        if (this.entries.size >= 32 || this.total + size > 64 * 1024 * 1024) throw new ToolError("quota_exceeded", "临时文件空间不足，请删除不用的文件");
        const fileRef = randomBytes(32).toString("base64url");
        const entry: Entry = {fileRef, size, sha256, mime, expiresAt: Date.now() + TTL, received: 0, ready: false};
        writeFileSync(join(this.root, fileRef), Buffer.alloc(0), {flag: "wx", mode: 0o600});
        this.entries.set(fileRef, entry); this.total += size;
        return this.info(entry);
    }
    chunk(fileRef: string, offset: number, data: string) {
        const entry = this.get(fileRef);
        if (!Number.isSafeInteger(offset) || offset < 0 || !/^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i.test(data)) throw new ToolError("invalid_arguments", "上传偏移或编码不正确");
        const bytes = Buffer.from(data, "base64");
        if (!bytes.length || bytes.length > CHUNK_BYTES || offset + bytes.length > entry.size) throw new ToolError("input_limit", "上传分块超过范围");
        if (offset < entry.received) {
            if (offset + bytes.length > entry.received) throw new ToolError("file_conflict", "上传分块发生冲突");
            const existing = this.readRange(fileRef, offset, bytes.length);
            if (!existing.equals(bytes)) throw new ToolError("file_conflict", "上传分块内容已变化");
        } else {
            if (entry.ready || offset !== entry.received) throw new ToolError("file_conflict", "请从已确认的位置继续上传");
            appendFileSync(join(this.root, fileRef), bytes); entry.received += bytes.length;
        }
        return {nextOffset: entry.received};
    }
    commit(fileRef: string): FileInfo {
        const entry = this.get(fileRef);
        if (entry.received !== entry.size) throw new ToolError("file_incomplete", "文件尚未上传完成");
        if (digest(readFileSync(join(this.root, fileRef))) !== entry.sha256) {
            this.remove(fileRef); throw new ToolError("checksum_mismatch", "文件校验失败，请重新上传");
        }
        entry.ready = true; return this.info(entry);
    }
    private info(entry: Entry): FileInfo {
        return {fileRef: entry.fileRef, size: entry.size, sha256: entry.sha256, mime: entry.mime, expiresAt: entry.expiresAt};
    }
    status(fileRef: string) { const entry = this.get(fileRef); return {...this.info(entry), state: entry.ready ? "ready" : "uploading", nextOffset: entry.received}; }
    private readRange(fileRef: string, offset: number, length: number) {
        const bytes = Buffer.alloc(length); const fd = openSync(join(this.root, fileRef), "r");
        try { return bytes.subarray(0, readSync(fd, bytes, 0, length, offset)); } finally { closeSync(fd); }
    }
    read(fileRef: string, offset: number, length = CHUNK_BYTES) {
        const entry = this.get(fileRef, true);
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > entry.size || !Number.isSafeInteger(length) || length < 1 || length > CHUNK_BYTES) throw new ToolError("invalid_arguments", "读取范围不正确");
        const bytes = this.readRange(fileRef, offset, Math.min(length, entry.size - offset));
        return {...this.info(entry), dataBase64: bytes.toString("base64"), offset, nextOffset: offset + bytes.length, eof: offset + bytes.length === entry.size};
    }
    bytes(fileRef: string) { this.get(fileRef, true); return readFileSync(join(this.root, fileRef)); }
    put(bytes: Uint8Array, mime = "application/octet-stream"): FileInfo {
        const info = this.begin(bytes.length, digest(bytes), mime, true);
        try {
            writeFileSync(join(this.root, info.fileRef), bytes); const entry = this.entries.get(info.fileRef)!;
            entry.received = bytes.length; entry.ready = true; return info;
        } catch (error) { this.remove(info.fileRef); throw error; }
    }
    remove(fileRef: string) {
        const entry = this.entries.get(fileRef);
        if (entry) { this.entries.delete(fileRef); this.total -= entry.size; rmSync(join(this.root, fileRef), {force: true}); }
        return {deleted: Boolean(entry)};
    }
    close() { clearInterval(this.timer); this.entries.clear(); this.total = 0; rmSync(this.root, {recursive: true, force: true}); }
}
