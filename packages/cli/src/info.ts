import { CORE_VERSION, YAMLStringify, resolveModelTokens } from "genaiscript-core"
import { buildProject } from "./build"

export async function systemInfo() {
    console.log(`node: ${process.version}`)
    console.log(`genaiscript: ${CORE_VERSION}`)
    console.log(`platform: ${process.platform}`)
    console.log(`arch: ${process.arch}`)
    console.log(`pid: ${process.pid}`)
}

export async function modelInfo(options?: { token?: boolean }) {
    const prj = await buildProject()
    const info = await resolveModelTokens(prj.templates, options)
    console.log(YAMLStringify(info))
}

