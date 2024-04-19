import { CONNECTION_CONFIGURATION_ERROR_CODE, CORE_VERSION, host, logError } from "genaiscript-core"

export async function systemInfo() {
    console.log(`node: ${process.version}`)
    console.log(`genaiscript: ${CORE_VERSION}`)
    console.log(`platform: ${process.platform}`)
    console.log(`arch: ${process.arch}`)
    console.log(`pid: ${process.pid}`)
}


export async function modelInfo(model: string, options: {
    aici: boolean,
    token: boolean
}) {
    const { aici } = options || {}
    console.log(`model: ${model}${aici ? " (aici)" : ""}`)

    const tok = await host.getSecretToken({ model, aici })
    if (!tok) {
        logError(`token not configured`)
        process.exit(CONNECTION_CONFIGURATION_ERROR_CODE)
    }

    let token = tok.token
    if (!options.token && token)
        token = "***"

    console.log(`source: "${tok.source || ""}"`)
    console.log(`type: ${tok.type || ""}`)
    console.log(`base: ${tok.base || ""}`)
    console.log(`version: ${tok.version || ""}`)
    console.log(`token: ${token}`)
}