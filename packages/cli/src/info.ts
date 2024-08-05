import { parseTokenFromEnv } from "../../core/src/connection"
import { MODEL_PROVIDERS } from "../../core/src/constants"
import { errorMessage } from "../../core/src/error"
import { host, runtimeHost } from "../../core/src/host"
import {
    ModelConnectionInfo,
    resolveModelConnectionInfo,
} from "../../core/src/models"
import { ServerEnvResponse } from "../../core/src/server/messages"
import { CORE_VERSION } from "../../core/src/version"
import { YAMLStringify } from "../../core/src/yaml"
import { buildProject } from "./build"

export async function systemInfo() {
    console.log(`node: ${process.version}`)
    console.log(`genaiscript: ${CORE_VERSION}`)
    console.log(`platform: ${process.platform}`)
    console.log(`arch: ${process.arch}`)
    console.log(`pid: ${process.pid}`)
}

export async function envInfo(provider: string, options?: { token?: boolean }) {
    const res = await resolveEnv(provider, options)
    console.log(YAMLStringify(res))
}

export async function resolveEnv(
    provider: string,
    options?: { token?: boolean }
): Promise<ServerEnvResponse> {
    const { token } = options || {}
    const res: ServerEnvResponse = {
        ok: true,
        env: host.dotEnvPath ?? "",
        providers: [],
    }
    const env = process.env
    for (const modelProvider of MODEL_PROVIDERS.filter(
        (mp) => !provider || mp.id === provider
    )) {
        try {
            const conn = await parseTokenFromEnv(env, `${modelProvider.id}:*`)
            if (conn) {
                if (!token && conn.token) conn.token = "***"
                res.providers.push(conn)
            }
        } catch (e) {
            res.providers.push({
                provider: modelProvider.id,
                model: undefined,
                base: undefined,
                error: errorMessage(e),
            })
        }
    }
    return res
}

async function resolveScriptsConnectionInfo(
    templates: ModelConnectionOptions[],
    options?: { token?: boolean }
): Promise<ModelConnectionInfo[]> {
    const models: Record<string, ModelConnectionOptions> = {}
    for (const template of templates) {
        const conn: ModelConnectionOptions = {
            model: template.model ?? runtimeHost.defaultModelOptions.model,
        }
        const key = JSON.stringify(conn)
        if (!models[key]) models[key] = conn
    }
    const res: ModelConnectionInfo[] = await Promise.all(
        Object.values(models).map((conn) =>
            resolveModelConnectionInfo(conn, options).then((res) => res.info)
        )
    )
    return res
}

export async function modelInfo(script: string, options?: { token?: boolean }) {
    const prj = await buildProject()
    const templates = prj.templates.filter(
        (t) =>
            !script ||
            t.id === script ||
            host.path.resolve(t.filename) === host.path.resolve(script)
    )
    const info = await resolveScriptsConnectionInfo(templates, options)
    console.log(YAMLStringify(info))
}
