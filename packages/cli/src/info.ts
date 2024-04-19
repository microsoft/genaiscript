import {
    CORE_VERSION,
    YAMLStringify,
    host,
    resolveModelTokens,
} from "genaiscript-core"
import { buildProject } from "./build"

export async function systemInfo() {
    console.log(`node: ${process.version}`)
    console.log(`genaiscript: ${CORE_VERSION}`)
    console.log(`platform: ${process.platform}`)
    console.log(`arch: ${process.arch}`)
    console.log(`pid: ${process.pid}`)
}

export async function modelInfo(script: string, options?: { token?: boolean }) {
    const prj = await buildProject()
    const templates = prj.templates.filter(
        (t) =>
            !script ||
            t.id === script ||
            host.path.resolve(t.filename) === host.path.resolve(script)
    )
    const info = await resolveModelTokens(templates, options)
    console.log(YAMLStringify(info))
}
