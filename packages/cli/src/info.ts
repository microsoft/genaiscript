/**
 * This module provides functions to display system, environment, and model information.
 * It includes functions for retrieving system specs, environment variables related to model providers,
 * and resolving model connection info for specific scripts.
 */

import { resolveLanguageModelConfigurations } from "../../core/src/config";
import { host, runtimeHost } from "../../core/src/host";
import {
  ModelConnectionInfo,
  resolveModelAlias,
  resolveModelConnectionInfo,
} from "../../core/src/models";
import { CORE_VERSION } from "../../core/src/version";
import { YAMLStringify } from "../../core/src/yaml";
import { buildProject } from "./build";
import { deleteUndefinedValues } from "../../core/src/cleaners";
import { LARGE_MODEL_ID } from "../../core/src/constants";
import { CSVStringify } from "../../core/src/csv";

/**
 * Outputs basic system information including node version, platform, architecture, and process ID.
 */
export async function systemInfo() {
  console.log(`node: ${process.version}`);
  console.log(`genaiscript: ${CORE_VERSION}`);
  console.log(`platform: ${process.platform}`);
  console.log(`arch: ${process.arch}`);
  console.log(`pid: ${process.pid}`);
}

/**
 * Outputs environment information for model providers.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to show tokens, errors, or models. The output hides sensitive information by default.
 */
export async function envInfo(
  provider: string,
  options: { token?: boolean; error?: boolean; models?: boolean },
) {
  const config = await runtimeHost.readConfig();
  const res: any = {};
  res[".env"] = config.envFile ?? "";
  res.providers = await resolveLanguageModelConfigurations(provider, {
    ...(options || {}),
    hide: true,
  });
  console.log(YAMLStringify(res));
}

/**
 * Resolves connection information for script templates by deduplicating model options.
 * @param scripts - Array of model connection options to resolve.
 * @param options - Configuration options, including whether to show tokens.
 * @returns A promise that resolves to an array of model connection information.
 */
async function resolveScriptsConnectionInfo(
  scripts: ModelConnectionOptions[],
  options?: { token?: boolean },
): Promise<ModelConnectionInfo[]> {
  const models: Record<string, ModelConnectionOptions> = {};

  // Deduplicate model connection options
  for (const script of scripts) {
    const conn: ModelConnectionOptions = {
      model: script.model ?? runtimeHost.modelAliases.large.model,
    };
    const key = JSON.stringify(conn);
    if (!models[key]) models[key] = conn;
  }

  // Resolve model connection information
  const res: ModelConnectionInfo[] = await Promise.all(
    Object.values(models).map((conn) =>
      resolveModelConnectionInfo(conn, {
        ...(options || {}),
        defaultModel: LARGE_MODEL_ID,
      }).then((res) => res.info),
    ),
  );
  return res;
}

/**
 * Outputs model connection information for a given script by resolving its templates.
 * Filters the scripts based on the provided script ID or filename. If no script is provided, all scripts are included.
 * @param script - The specific script ID or filename to filter by. If not provided, all scripts are included.
 * @param options - Configuration options, including whether to show tokens.
 */
export async function scriptModelInfo(script: string, options?: { token?: boolean }) {
  const prj = await buildProject();
  const templates = prj.scripts.filter(
    (t) =>
      !script || t.id === script || host.path.resolve(t.filename) === host.path.resolve(script),
  );
  const info = await resolveScriptsConnectionInfo(templates, options);
  console.log(YAMLStringify(info));
}

/**
 * Outputs detailed information about model aliases and their resolved configurations.
 * Each alias is expanded with its resolved counterpart.
 *
 * This function iterates over the `modelAliases` in the runtime host,
 * retrieves configuration details for each alias, resolves them using `resolveModelAlias`,
 * and outputs the data in YAML format.
 *
 * @param none This function does not require any parameters.
 */
export async function modelAliasesInfo() {
  const res = Object.fromEntries(
    Object.entries(runtimeHost.modelAliases).map(([k, v]) => [
      k,
      {
        ...v,
        resolved: resolveModelAlias(k),
      },
    ]),
  );
  console.log(YAMLStringify(res));
}

/**
 * Outputs a list of models and their information for the specified provider.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to include errors, tokens, models, and the output format (JSON or YAML).
 */
export async function modelList(
  provider: string,
  options?: { error?: boolean; format?: "json" | "yaml" },
) {
  await runtimeHost.readConfig();
  const providers = await resolveLanguageModelConfigurations(provider, {
    ...(options || {}),
    models: true,
    error: true,
    hide: true,
    token: true,
  });

  if (options?.format === "json") console.log(JSON.stringify(providers, null, 2));
  else
    console.log(
      YAMLStringify(
        deleteUndefinedValues(
          Object.fromEntries(providers.map((p) => [p.provider, p.error || p.models])),
        ),
      ),
    );
}
