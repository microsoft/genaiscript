import { appendJSONL, readJSONL, writeJSONL } from "./jsonl"
import { host, runtimeHost } from "./host"
import { dotGenaiscriptPath, sha256string } from "./util"
import { CHANGE } from "./constants"
import { TraceOptions } from "./trace"
import { CORE_VERSION } from "./version"

export type CacheEntry<K, V> = { sha: string; key: K; val: V }

export class JSONLineCache<K, V> extends EventTarget {
    private _entries: Record<string, CacheEntry<K, V>>
    private constructor(public readonly name: string) {
        super()
    }

    static byName<K, V>(name: string): JSONLineCache<K, V> {
        name = name.replace(/[^a-z0-9_]/gi, "_")
        const key = "cacheKV." + name
        if (host.userState[key]) return host.userState[key]
        const r = new JSONLineCache<K, V>(name)
        host.userState[key] = r
        return r
    }

    private folder() {
        return dotGenaiscriptPath("cache", this.name)
    }
    private path() {
        return host.resolvePath(this.folder(), "db.jsonl")
    }
    private async initialize() {
        if (this._entries) return
        this._entries = {}
        await host.createDirectory(this.folder())
        const objs: CacheEntry<K, V>[] = await readJSONL(this.path())
        let numdup = 0
        for (const obj of objs) {
            if (this._entries[obj.sha]) numdup++
            this._entries[obj.sha] = obj
        }
        if (2 * numdup > objs.length) {
            // if too many duplicates, rewrite the file
            // keep the order of entries
            await writeJSONL(
                this.path(),
                objs.filter((o) => this._entries[o.sha] === o)
            )
        }
    }

    async keys(): Promise<K[]> {
        await this.initialize()
        return Object.values(this._entries).map((kv) => kv.key)
    }
    async entries(): Promise<CacheEntry<K, V>[]> {
        await this.initialize()
        return Object.values(this._entries).map((e) => ({ ...e }))
    }
    async getEntryBySha(sha: string) {
        await this.initialize()
        return this._entries[sha]
    }
    async get(key: K): Promise<V> {
        await this.initialize()
        const sha = await keySHA(key)
        return this._entries[sha]?.val
    }
    async set(key: K, val: V, options?: TraceOptions) {
        const { trace } = options || {}
        await this.initialize()
        const sha = await keySHA(key)
        const ent = { sha, key, val }
        const ex = this._entries[sha]
        if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return
        this._entries[sha] = ent
        await appendJSONL(this.path(), [ent])
        trace?.item(`cache ${this.name} set`)
        this.dispatchEvent(new Event(CHANGE))
    }
    async getKeySHA(key: K) {
        await this.initialize()
        const sha = await keySHA(key)
        return sha
    }
}
async function keySHA(key: any) {
    if (typeof key != "string") key = JSON.stringify(key) + CORE_VERSION
    return await sha256string(key)
}
