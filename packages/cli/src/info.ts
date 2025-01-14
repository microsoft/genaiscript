/**
 * This module provides functions to display system, environment, and model information.
 * It includes functions for retrieving system specs, environment variables related to model providers,
 * and resolving model connection info for specific scripts.
 */

import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { host, runtimeHost } from "../../core/src/host"
import {
    ModelConnectionInfo,
    resolveModelConnectionInfo,
} from "../../core/src/models"
import { CORE_VERSION } from "../../core/src/version"
import { YAMLStringify } from "../../core/src/yaml"
import { buildProject } from "./build"

/**
 * Outputs basic system information including node version, platform, architecture, and process ID.
 */
export async function systemInfo() {
    console.log(`node: ${process.version}`)
    console.log(`genaiscript: ${CORE_VERSION}`)
    console.log(`platform: ${process.platform}`)
    console.log(`arch: ${process.arch}`)
    console.log(`pid: ${process.pid}`)
}

/**
 * Outputs environment information for model providers.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to show tokens.
 */
export async function envInfo(
    provider: string,
    options?: { token?: boolean; error?: boolean; models?: boolean }
) {
    const config = await runtimeHost.readConfig()
    const res: any = {}
    res[".env"] = config.envFile ?? ""
    res.providers = await resolveLanguageModelConfigurations(provider, options)
    console.log(YAMLStringify(res))
}

/**
 * Resolves connection information for script templates by deduplicating model options.
 * @param scripts - Array of model connection options to resolve.
 * @param options - Configuration options, including whether to show tokens.
 * @returns A promise that resolves to an array of model connection information.
 */
async function resolveScriptsConnectionInfo(
    scripts: ModelConnectionOptions[],
    options?: { token?: boolean }
): Promise<ModelConnectionInfo[]> {
    const models: Record<string, ModelConnectionOptions> = {}

    // Deduplicate model connection options
    for (const script of scripts) {
        const conn: ModelConnectionOptions = {
            model: script.model ?? runtimeHost.modelAliases.large.model,
        }
        const key = JSON.stringify(conn)
        if (!models[key]) models[key] = conn
    }

    // Resolve model connection information
    const res: ModelConnectionInfo[] = await Promise.all(
        Object.values(models).map((conn) =>
            resolveModelConnectionInfo(conn, options).then((res) => res.info)
        )
    )
    return res
}

/**
 * Outputs model connection info for a given script.
 * @param script - The specific script ID or filename to filter by (optional).
 * @param options - Configuration options, including whether to show tokens.
 */
export async function scriptModelInfo(
    script: string,
    options?: { token?: boolean }
) {
    const prj = await buildProject()
    const templates = prj.scripts.filter(
        (t) =>
            !script ||
            t.id === script ||
            host.path.resolve(t.filename) === host.path.resolve(script)
    )
    const info = await resolveScriptsConnectionInfo(templates, options)
    console.log(YAMLStringify(info))
}

export async function modelAliasesInfo() {
    console.log(YAML.stringify(runtimeHost.modelAliases))
}
