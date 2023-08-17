import { appendJSONL, readJSONL, writeJSONL } from "./jsonl"
import { host, coarchExt } from "./host"
import { dotCoarchPath, sha256string } from "./util"

type Entry<K, V> = { sha: string; key: K; val: V }

export class Cache<K, V> {
    private entries: Record<string, Entry<K, V>>
    private constructor(public name: string) {}

    static byName<K, V>(name: string): Cache<K, V> {
        const key = "cacheKV." + name
        if (host.userState[key]) return host.userState[key]
        const r = new Cache<K, V>(name)
        host.userState[key] = r
        return r
    }

    private folder() {
        return dotCoarchPath("cache")
    }
    private path() {
        return host.resolvePath(this.folder(), this.name + coarchExt)
    }
    private async initialize() {
        if (this.entries) return
        this.entries = {}
        await host.createDirectory(this.folder())
        const objs: Entry<K, V>[] = await readJSONL(this.path())
        let numdup = 0
        for (const obj of objs) {
            if (this.entries[obj.sha]) numdup++
            this.entries[obj.sha] = obj
        }
        if (2 * numdup > objs.length) {
            // if too many duplicates, rewrite the file
            // keep the order of entries
            await writeJSONL(
                this.path(),
                objs.filter((o) => this.entries[o.sha] === o)
            )
        }
    }

    async get(key: K): Promise<V> {
        await this.initialize()
        const sha = await keySHA(key)
        return this.entries[sha]?.val
    }
    async set(key: K, val: V) {
        const sha = await keySHA(key)
        const ent = { sha, key, val }
        const ex = this.entries[sha]
        if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return
        this.entries[sha] = ent
        await appendJSONL(this.path(), [ent])
    }
}
async function keySHA(key: any) {
    if (typeof key != "string") key = JSON.stringify(key)
    return await sha256string(key)
}
