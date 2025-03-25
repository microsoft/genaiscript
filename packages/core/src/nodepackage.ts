import debug from "debug"
const dbg = debug("genaiscript:node:package")
import { tryReadJSON } from "./fs"

export async function nodeIsPackageTypeModule() {
    const pkg = await tryReadJSON("package.json")
    dbg(`type: ${pkg?.type || ""}`)
    const isModule = pkg?.type === "module"
    return isModule
}
