// Import necessary modules and types
import { host } from "./host"
import { writeText } from "./fs"
import { dotGenaiscriptPath } from "./workdir"
import { CacheEntry, MemoryCache } from "./cache"
import { basename, join } from "node:path"
import debug from "debug"
import { errorMessage } from "./error"
import { tryReadJSON } from "./fs"
import { rm, readdir } from "fs/promises"
const dbg = debug("genaiscript:cache")

/**
 * A cache class stores each entry as a separate file in a directory.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class DirectoryCache<K, V> implements WorkspaceFileCache<any, any> {
    private _dbg: typeof dbg
    // Constructor is private to enforce the use of byName factory method
    protected constructor(public readonly name: string) {
        this._dbg = debug(`genaiscript:cache:${name}`)
    }

    private cacheFilename(sha: string) {
        return join(this.folder(), sha + ".json")
    }

    async get(key: any): Promise<any> {
        const sha = await MemoryCache.keySHA(key)
        const fn = this.cacheFilename(sha)
        return await tryReadJSON(fn)
    }
    async set(key: any, value: any): Promise<void> {
        const sha = await MemoryCache.keySHA(key)
        const fn = this.cacheFilename(sha)
        try {
            if (value === undefined) await rm(fn)
            else await writeText(fn, JSON.stringify(value, null, 2))
        } catch (e) {
            this._dbg(`error writing ${fn}: ${errorMessage(e)}`)
        }
    }
    async values(): Promise<any[]> {
        try {
            const files = await readdir(this.folder())
            return files
                .filter((f) => /\.json$/.test(f))
                .map((f) => basename(f).replace(/\.json$/, ""))
        } catch (e) {
            this._dbg(
                `error while reading directory ${this.folder()}: ${errorMessage(e)}`
            )
            return []
        }
    }

    /**
     * Factory method to create or retrieve an existing cache by name.
     * Sanitizes the name to ensure it is a valid identifier.
     * @param name - The name of the cache
     * @returns An instance of JSONLineCache
     */
    static byName<K, V>(name: string): DirectoryCache<K, V> {
        if (!name) return undefined
        name = name.replace(/[^a-z0-9_]/gi, "_") // Sanitize name
        const key = "directory." + name
        if (host.userState[key]) return host.userState[key] // Return if exists
        const r = new DirectoryCache<K, V>(name)
        host.userState[key] = r
        return r
    }

    // Get the folder path for the cache storage
    private folder() {
        return dotGenaiscriptPath("cache", this.name)
    }
}
