// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functions to display system, environment, and model information.
 * It includes functions for retrieving system specs, environment variables related to model providers,
 * and resolving model connection info for specific scripts.
 */

import { run } from "@genaiscript/api";
import {
  LARGE_MODEL_ID,
  CORE_VERSION,
  type ModelConnectionInfo,
  type ModelConnectionOptions,
  YAMLStringify,
  deleteUndefinedValues,
  resolveLanguageModelConfigurations,
  resolveModelAlias,
  resolveModelConnectionInfo,
  resolveRuntimeHost,
  EMBEDDINGS_MODEL_ID,
} from "@genaiscript/core";
import { buildProject } from "@genaiscript/core";
import { resolve } from "node:path";

/**
 * Outputs basic system information including node version, platform, architecture, and process ID.
 */
export async function systemInfo(): Promise<void> {
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
): Promise<void> {
  const runtimeHost = resolveRuntimeHost();
  const config = await runtimeHost.readConfig();
  const res: Record<string, unknown> = {};
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
  const runtimeHost = resolveRuntimeHost();
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
      }).then((r) => r.info),
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
export async function scriptModelInfo(
  script: string,
  options?: { token?: boolean },
): Promise<void> {
  const prj = await buildProject();
  const templates = prj.scripts.filter(
    (t) => !script || t.id === script || resolve(t.filename) === resolve(script),
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
export async function modelAliasesInfo(options?: { check?: boolean }): Promise<void> {
  const { check } = options || {};
  const runtimeHost = resolveRuntimeHost();
  const res = Object.fromEntries(
    Object.entries(runtimeHost.modelAliases).map(([k, v]) => [
      k,
      {
        ...v,
        resolved: resolveModelAlias(k),
      },
    ]),
  );

  if (check) {
    for (const [alias, config] of Object.entries(res)) {
      if (alias === EMBEDDINGS_MODEL_ID) continue;
      const inference = await run(alias, [], {
        jsSource: `script({
    unlisted: true,
    system: [],
    systemSafety: false
})
$\`Write the word "hello" in lowercase.\`
`,
        model: alias,
        runTrace: false,
        outputTrace: false,
        temperature: 0,
        maxTokens: 10,
      });
      (config as any).inference = inference?.error?.message || inference?.status || "error";
    }
  }
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
): Promise<void> {
  const runtimeHost = resolveRuntimeHost();
  await runtimeHost.readConfig();
  const providers = await resolveLanguageModelConfigurations(provider, {
    ...(options || {}),
    models: true,
    error: true,
    hide: true,
    token: true,
  });

  if (options?.format === "json") console.log(JSON.stringify(providers, null, 2));
  else {
    console.log(
      YAMLStringify(
        deleteUndefinedValues(
          Object.fromEntries(providers.map((p) => [p.provider, p.error || p.models])),
        ),
      ),
    );
  }
}
