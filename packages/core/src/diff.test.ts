import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { parseLLMDiffs } from "./diff"

describe("diff", () => {
    test("is_valid_email", () => {
        const source = `[1] import re
[2] 
[3] def is_valid_email(email):
- [4]     if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
+ [4]     pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
+ [5]     if pattern.fullmatch(email):
[6]         return True
[7]     else:
[8]         return False`
        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 4)
    })

    test("missing line numbers", () => {
        const source = `
[10] CONSTANT
-     \* @type: XXX;
+     \* @type: Int;
[15] VARIABLES
-     \* @type: [Node -> XXX];
+     \* @type: [Node -> Bool];
-     \* @type: [Node -> XXX];
+     \* @type: [Node -> Str];
-     \* @type: XXX;
+     \* @type: Int;
-     \* @type: XXX;
+     \* @type: Str;
`

        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 12)
    })

    test("missing line numbers 2", () => {
        const source = `
[17] CONSTANTS
-     \* @type: ???;
+     \* @type: Int;
[19]     N,
-     \* @type: ???;
+     \* @type: Int;
[21]     T,
-     \* @type: ???;
+     \* @type: Int;
[23]     F
[28] VARIABLE 
-   \* @type: ???;
+   \* @type: Str -> Str;
[30]   pc,
-   \* @type: ???;
+   \* @type: Str -> Set(<<Int, Str>>);
[32]   rcvd,
-   \* @type: ???;
+   \* @type: Set(<<Int, Str>>);
[34]   sent
`

        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 19)
    })

    test("source same as added", () => {
        const source = `[9] Annotations are errors, warning or notes that can be added to the LLM output. They are extracted and injected in VSCode or your CI environment.
+ Annotations are errors, warnings, or notes that can be added to the LLM output. They are extracted and injected into VSCode or your CI environment.
[30] The \`system.annotations\` prompt automatically enables line number injection for all \`def\` section. This helps
- [31] with the precision of the LLM answer and reduces hallucinations.
+ [31] with the precision of the LLM answer and reduces the likelihood of hallucinations.
[40] The annotation are converted into Visual Studio **Diagnostics** which are presented to the user
+ The annotations are converted into Visual Studio **Diagnostics**, which are presented to the user
[45] GenAIScript will convert those into SARIF files that can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similarly to CodeQL reports.
+ GenAIScript will convert these into SARIF files that can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similar to CodeQL reports.
[75]       # Upload the generate SARIF file to GitHub
+       # Upload the generated SARIF file to GitHub
[85] -   Access to security reports may vary based on your repository visibilty and organization
+ [85] -   Access to security reports may vary based on your repository visibility and organization
[87] -   Your organization may restrict the execution of GitHub Actions on Pull Requests.
+ [87] -   Your organization may restrict the execution of GitHub Actions on pull requests.
[92] You can use the [defOutput](/genaiscript/reference/scripts/custom-output/) function
- [93] to filter the annotations.
+ [93] to filter annotations.`
        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 18)
    })

    test("start offset", () => {
        const source = `[6] import { CORE_VERSION } from "./version"
[7] 
[8] // Represents a cache entry with a hash (sha), key, and value
[9] export type CacheEntry<K, V> = { sha: string; key: K; val: V }
[10] 
[11] // JSONLineCache manages a cache stored in JSONL format
[12] export class JSONLineCache<K, V> extends EventTarget {
[13]     private _entries: Record<string, CacheEntry<K, V>>
[14]     private constructor(public readonly name: string) {
[15]         super()
[16]     }
[17] 
[18]     // Creates or retrieves a cache by name
[19]     static byName<K, V>(name: string): JSONLineCache<K, V> {
[20]         name = name.replace(/[^a-z0-9_]/gi, "_") // Sanitize cache name
[21]         const key = "cacheKV." + name
[22]         if (host.userState[key]) return host.userState[key]
[23]         const r = new JSONLineCache<K, V>(name)
[24]         host.userState[key] = r
[25]         return r
[26]     }
[27] 
[28]     // Returns the folder path for the cache
[29]     private folder() {
[30]         return dotGenaiscriptPath("cache", this.name)
[31]     }
[32]     // Returns the full file path for the cache data
[33]     private path() {
[34]         return host.resolvePath(this.folder(), "db.jsonl")
[35]     }
[36]     // Initializes the cache entries from the JSONL file
[37]     private async initialize() {
[38]         if (this._entries) return
[39]         this._entries = {}
[40]         await host.createDirectory(this.folder())
[41]         const objs: CacheEntry<K, V>[] = await readJSONL(this.path())
[42]         let numdup = 0
[43]         for (const obj of objs) {
[44]             if (this._entries[obj.sha]) numdup++ // Count duplicate entries
[45]             this._entries[obj.sha] = obj
[46]         }
[47]         if (2 * numdup > objs.length) {
[48]             // If too many duplicates, rewrite the file to remove them
[49]             // Keep the order of entries
[50]             await writeJSONL(
[51]                 this.path(),
[52]                 objs.filter((o) => this._entries[o.sha] === o)
[53]             )
[54]         }
[55]     }
[56] 
[57]     // Returns all keys in the cache
[58]     async keys(): Promise<K[]> {
[59]         await this.initialize()
[60]         return Object.values(this._entries).map((kv) => kv.key)
[61]     }
[62]     // Returns all cache entries
[63]     async entries(): Promise<CacheEntry<K, V>[]> {
[64]         await this.initialize()
[65]         return Object.values(this._entries).map((e) => ({ ...e }))
[66]     }
[67]     // Retrieves an entry by its hash
[68]     async getEntryBySha(sha: string) {
[69]         await this.initialize()
[70]         return this._entries[sha]
[71]     }
[72]     // Retrieves a value by its key
[73]     async get(key: K): Promise<V> {
[74]         if (key === undefined) return undefined
[75]         await this.initialize()
[76]         const sha = await keySHA(key)
[77]         return this._entries[sha]?.val
[78]     }
[79]     // Sets a key-value pair in the cache and appends it to the file
[80]     async set(key: K, val: V, options?: TraceOptions) {
[81]         const { trace } = options || {}
[82]         await this.initialize()
[83]         const sha = await keySHA(key)
[84]         const ent = { sha, key, val }
[85]         const ex = this._entries[sha]
[86]         if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return // No change
[87]         this._entries[sha] = ent
[88]         await appendJSONL(this.path(), [ent]) // Add new entry to JSONL
[89]         trace?.item(\`cache \${this.name} set\`)
[90]         this.dispatchEvent(new Event(CHANGE)) // Notify change
[91]     }
[92]     // Computes the SHA for a given key
[93]     async getKeySHA(key: K) {
[94]         await this.initialize()
[95]         const sha = await keySHA(key)
[96]         return sha
[97]     }
[98] }
[99] // Computes a SHA-256 hash for a key, appending the CORE_VERSION if not a string
[100] async function keySHA(key: any) {
[101]    if (typeof key != "string") key = JSON.stringify(key) + CORE_VERSION
[102]    return await sha256string(key)
[103] }
`
        const chunks = parseLLMDiffs(source)
        console.log(chunks)
    })

    test("insert after incorrect line description", () => {
        const source = `[1] import { appendJSONL, readJSONL, writeJSONL } from "./jsonl"
[2] import { host, runtimeHost } from "./host"
[3] import { dotGenaiscriptPath, sha256string } from "./util"
[4] import { CHANGE } from "./constants"
[5] import { TraceOptions } from "./trace"
[6] import { CORE_VERSION } from "./version"
[7] 
[8] export type CacheEntry<K, V> = { sha: string; key: K; val: V }
[9] 
[10] export class JSONLineCache<K, V> extends EventTarget {
[11]     private _entries: Record<string, CacheEntry<K, V>>
[12]     private constructor(public readonly name: string) {
[13]         super()
[14]     }
[15] 
[16]     static byName<K, V>(name: string): JSONLineCache<K, V> {
[17]         name = name.replace(/[^a-z0-9_]/gi, "_")
[18]         const key = "cacheKV." + name
[19]         if (host.userState[key]) return host.userState[key]
[20]         const r = new JSONLineCache<K, V>(name)
[21]         host.userState[key] = r
[22]         return r
[23]     }
[24] 
[25]     private folder() {
[26]         return dotGenaiscriptPath("cache", this.name)
[27]     }
[28]     private path() {
[29]         return host.resolvePath(this.folder(), "db.jsonl")
[30]     }
[31]     private async initialize() {
[32]         if (this._entries) return
[33]         this._entries = {}
[34]         await host.createDirectory(this.folder())
[35]         const objs: CacheEntry<K, V>[] = await readJSONL(this.path())
[36]         let numdup = 0
[37]         for (const obj of objs) {
[38]             if (this._entries[obj.sha]) numdup++
[39]             this._entries[obj.sha] = obj
[40]         }
[41]         if (2 * numdup > objs.length) {
[42]             // if too many duplicates, rewrite the file
[43]             // keep the order of entries
[44]             await writeJSONL(
[45]                 this.path(),
[46]                 objs.filter((o) => this._entries[o.sha] === o)
[47]             )
[48]         }
[49]     }
[50] 
[51]     async keys(): Promise<K[]> {
[52]         await this.initialize()
[53]         return Object.values(this._entries).map((kv) => kv.key)
[54]     }
[55]     async entries(): Promise<CacheEntry<K, V>[]> {
[56]         await this.initialize()
[57]         return Object.values(this._entries).map((e) => ({ ...e }))
[58]     }
[59]     async getEntryBySha(sha: string) {
[60]         await this.initialize()
[61]         return this._entries[sha]
[62]     }
[63]     async get(key: K): Promise<V> {
[64]         if (key === undefined) return undefined
[65]         await this.initialize()
[66]         const sha = await keySHA(key)
[67]         return this._entries[sha]?.val
[68]     }
[69]     async set(key: K, val: V, options?: TraceOptions) {
[70]         const { trace } = options || {}
[71]         await this.initialize()
[72]         const sha = await keySHA(key)
[73]         const ent = { sha, key, val }
[74]         const ex = this._entries[sha]
[75]         if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return
[76]         this._entries[sha] = ent
[77]         await appendJSONL(this.path(), [ent])
[78]         trace?.item(\`cache \${this.name} set\`)
[79]         this.dispatchEvent(new Event(CHANGE))
[80]     }
[81]     async getKeySHA(key: K) {
[82]         await this.initialize()
[83]         const sha = await keySHA(key)
[84]         return sha
[85]     }
[86] }
[87] async function keySHA(key: any) {
[88]     if (typeof key != "string") key = JSON.stringify(key) + CORE_VERSION
[89]     return await sha256string(key)
[90] }`
        const chunks = parseLLMDiffs(source)
        console.log(chunks)
    })
})
