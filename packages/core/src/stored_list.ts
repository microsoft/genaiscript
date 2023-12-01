import { appendJSONL, readJSONL } from "./jsonl"
import { host, coarchExt } from "./host"
import { dotGptoolsPath } from "./util"

export class StoredList<T, U = unknown> {
    userData: U
    private _entries: T[]
    private constructor(public name: string) {}

    static byName<T, U = unknown>(name: string): StoredList<T, U> {
        const key = "storedList." + name
        if (host.userState[key]) return host.userState[key]
        const r = new StoredList<T, U>(name)
        host.userState[key] = r
        return r
    }

    private folder() {
        return dotGptoolsPath("state")
    }
    private path() {
        return host.resolvePath(this.folder(), this.name + coarchExt)
    }
    private async initialize() {
        if (this._entries) return
        await host.createDirectory(this.folder())
        this._entries = await readJSONL(this.path())
    }

    async entries(): Promise<ReadonlyArray<T>> {
        await this.initialize()
        return this._entries
    }

    async push(...v: T[]) {
        v = JSON.parse(JSON.stringify(v))
        if (this._entries) this._entries.push(...v)
        await appendJSONL(this.path(), v)
    }
}
