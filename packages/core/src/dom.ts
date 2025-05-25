import { genaiscriptDebug } from "./debug"
import { resolveGlobal } from "./global"
const dbg = genaiscriptDebug("dom")

export async function installWindow() {
    const glb = resolveGlobal() // Get the global context
    if (glb.window) return

    dbg(`installing window`)
    const { JSDOM } = await import("jsdom")
    const createDOMPurify = (await import("dompurify")).default

    const { window } = new JSDOM("<!DOCTYPE html>")
    const DOMPurify = createDOMPurify(window)
    glb.window = window
    glb.DOMPurify = DOMPurify

    // mermaid workaround
    createDOMPurify.addHook = DOMPurify.addHook.bind(DOMPurify)
    createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify)
}
