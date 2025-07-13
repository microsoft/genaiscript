// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This module provides functionality to test prompt scripts, including running,
// listing, and viewing results. It handles configuration setup, execution logic,
// and result processing.

import { PROMPTFOO_VERSION } from "@genaiscript/runtime";
import { delay, shuffle } from "es-toolkit";
import {
  BOX_RIGHT,
  BOX_UP_AND_RIGHT,
  createCancellationController,
  dataTryParse,
  evaluateTestResult,
  genaiscriptDebug,
  generateId,
  getTestDir,
  isCancelError,
  logError,
  prettyDuration,
  prettyTokens,
  randomHex,
  rmDir,
  toWorkspaceFile,
  tryStat,
} from "@genaiscript/core";
import { execa } from "execa";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  CORE_VERSION,
  EMOJI_FAIL,
  EMOJI_SUCCESS,
  FILES_NOT_FOUND_ERROR_CODE,
  GENAI_ANY_REGEX,
  GENAISCRIPT_FOLDER,
  PROMPTFOO_CACHE_PATH,
  PROMPTFOO_CONFIG_DIR,
  PROMPTFOO_REMOTE_API_PORT,
  TEST_RUNS_DIR_NAME,
  JSON5TryParse,
  MarkdownTrace,
  YAMLStringify,
  applyModelOptions,
  arrayify,
  checkCancelled,
  dotGenaiscriptPath,
  ensureDir,
  filterScripts,
  generatePromptFooConfiguration,
  headersToMarkdownTableHead,
  headersToMarkdownTableSeparator,
  link,
  logInfo,
  logVerbose,
  normalizeFloat,
  normalizeInt,
  objectToMarkdownTableRow,
  promptFooDriver,
  resolveModelConnectionInfo,
  roundWithPrecision,
  runtimeHost,
  serializeError,
  toStringList,
  getModulePaths,
  buildProject,
} from "@genaiscript/core";
import type {
  ChatCompletionReasoningEffort,
  CancellationOptions,
  ModelAliasesOptions,
  ModelOptions,
  PromptScript,
  PromptScriptTestResult,
  PromptScriptTestRunOptions,
  PromptScriptTestRunResponse,
  SerializedError,
  PromptTest,
  PromptScriptRunOptions,
  ElementOrArray,
  PromptTestConfiguration,
} from "@genaiscript/core";
import { run } from "@genaiscript/api";
const dbg = genaiscriptDebug("test");
const dbgConfig = genaiscriptDebug("test:config");
const dbgRun = genaiscriptDebug("test:run");

const { __filename } =
  typeof module !== "undefined" && module.filename
    ? getModulePaths(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getModulePaths(import.meta);

/**
 * Parses model specifications from a string and returns a ModelOptions object.
 * @param m - The string representation of the model specification.
 * @returns A ModelOptions object with model, temperature, and topP fields if applicable.
 */
function parseModelSpec(m: string): ModelOptions & ModelAliasesOptions {
  const values = m
    .split(/&/g)
    .map((kv) => kv.split("=", 2))
    .reduce(
      (acc, [key, value]) => {
        acc[key] = decodeURIComponent(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  if (Object.keys(values).length > 1)
    return {
      model: values["m"],
      smallModel: values["s"],
      visionModel: values["v"],
      temperature: normalizeFloat(values["t"]),
      topP: normalizeFloat(values["p"]),
      reasoningEffort: values["r"] as ChatCompletionReasoningEffort,
    } satisfies ModelOptions & ModelAliasesOptions;
  else return { model: m };
}

/**
 * Creates an environment object for execution with defaults and optional overrides.
 * @returns An environment object with necessary configurations.
 */
function createEnv() {
  const env = process.env;
  return {
    ...process.env,
    PROMPTFOO_CACHE_PATH: env.PROMPTFOO_CACHE_PATH ?? PROMPTFOO_CACHE_PATH,
    PROMPTFOO_CONFIG_DIR: env.PROMPTFOO_CONFIG_DIR ?? PROMPTFOO_CONFIG_DIR,
    PROMPTFOO_DISABLE_TELEMETRY: env.PROMPTFOO_DISABLE_TELEMETRY ?? "true",
    PROMPTFOO_DISABLE_UPDATE: env.PROMPTFOO_DISABLE_UPDATE ?? "true",
    PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION:
      env.PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION ?? "true",
  };
}

/**
 * Runs prompt script tests based on provided IDs and options, returns the test results.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run, including output paths, CLI settings, caching, verbosity, concurrency, redteam mode, promptfoo version, output summary, test delay, test timeout, max concurrency, and cancellation options.
 * @returns A Promise resolving to the test run response, including results, status, and error details if applicable.
 */
export async function runPromptScriptTests(
  ids: string[],
  options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    maxConcurrency?: string;
    testTimeout?: string;
    random?: boolean;
    promptfoo?: boolean;
  } & CancellationOptions,
): Promise<PromptScriptTestRunResponse> {
  const { promptfoo } = options || {};
  if (promptfoo) return await promptFooRunPromptScriptTests(ids, options);
  return await apiRunPromptScriptTests(ids, options);
}

async function resolveTests(script: PromptScript): Promise<PromptTest[]> {
  const tests = arrayify(script.tests || []);
  const res: PromptTest[] = [];
  for (const test of tests) {
    if (typeof test === "string") {
      dbgConfig(`resolving tests: %s`, test);
      const data = arrayify(
        (await dataTryParse(toWorkspaceFile(test))) as ElementOrArray<PromptTest>,
      );
      if (data?.length) {
        dbgConfig(`imported %d tests`, data.length);
        res.push(...data);
      }
    } else {
      res.push(test);
    }
  }
  return res;
}

async function apiRunPromptScriptTests(
  ids: string[],
  options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    maxConcurrency?: string;
    testTimeout?: string;
    random?: boolean;
    promptfoo?: boolean;
  } & CancellationOptions,
): Promise<PromptScriptTestRunResponse> {
  applyModelOptions(options, "cli");
  const { cancellationToken, random } = options || {};
  const scripts = await listTests({ ids, ...(options || {}) });
  if (!scripts.length)
    return {
      ok: false,
      status: FILES_NOT_FOUND_ERROR_CODE,
      error: serializeError(new Error("no tests found")),
    };

  const runId = randomHex(6);
  const out = options.out || getTestDir(runId);
  const testDelay = normalizeInt(options?.testDelay);
  //const maxConcurrency = normalizeInt(options?.maxConcurrency);
  const runStart = new Date();
  logVerbose(`out: ${out}`);
  if (options?.removeOut) await rmDir(out);
  await ensureDir(out);

  let outSummary = options.outSummary ? resolve(options.outSummary) : undefined;
  if (!outSummary) {
    outSummary = dotGenaiscriptPath(
      TEST_RUNS_DIR_NAME,
      `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`,
    );
  }

  // Prepare test configurations for each script
  const optionsModels = Object.freeze(options.models?.map(parseModelSpec));
  dbg(`options models: %o`, optionsModels);
  let configurations: PromptTestConfiguration[] = [];
  for (const script of scripts) {
    dbg(`script: %s`, script.id);
    checkCancelled(cancellationToken);
    const testModels = arrayify(script.testModels).map((m) =>
      typeof m === "string" ? parseModelSpec(m) : m,
    );
    if (testModels.length) dbgConfig(`test models: %o`, testModels);
    const models = arrayify(testModels?.length ? testModels : optionsModels?.slice(0));
    if (!models.length) models.push({});
    const tests = await resolveTests(script);
    dbg(`tests: %d, models: %d`, tests.length, models.length);
    for (const model of models) {
      for (const test of tests) {
        const options: Partial<PromptScriptRunOptions> = {
          out: join(out, `${generateId()}.trace.json`),
          ...model,
        };
        configurations.push({ script, test, options });
      }
    }
  }

  dbg(`configurations: %d`, configurations.length);

  if (random) {
    dbg(`shuffling configurations`);
    configurations = shuffle(configurations);
  }

  const stats = {
    prompt: 0,
    completion: 0,
    total: 0,
  };
  const headers = ["status", "script", "prompt", "completion", "total", "duration", "error"];
  if (outSummary) {
    dbg(`summary: %s`, outSummary);
    await ensureDir(dirname(outSummary));
    await appendFile(
      outSummary,
      [headersToMarkdownTableHead(headers), headersToMarkdownTableSeparator(headers)].join(""),
    );
  }
  const results = [];
  try {
    for (const config of configurations) {
      checkCancelled(cancellationToken);
      const { script, options, test } = config;
      logInfo(`test ${script.id} - ${results.length + 1}/${configurations.length}`);
      const elapsed = Date.now() - runStart.getTime();
      logVerbose(
        BOX_UP_AND_RIGHT +
          BOX_RIGHT +
          toStringList(
            prettyDuration(elapsed),
            `${results.filter((r) => !r.ok).length} failed`,
            `${results.filter((r) => r.ok).length} success`,
            prettyTokens(stats.total, "both"),
            prettyTokens(stats.prompt, "prompt"),
            prettyTokens(stats.completion, "completion"),
          ),
      );
      dbgRun(`options: %O`, options);
      const { files = [] } = test;
      const res = await run(script.id, files, {
        ...options,
        runTrace: false,
        outputTrace: false,
      });
      const { usage } = res || { error: { message: "run failed" }, status: "error" };
      const error = await evaluateTestResult(config, res);

      const ok = !error;
      stats.prompt += usage?.prompt || 0;
      stats.completion += usage?.completion || 0;
      stats.total += usage?.total || 0;
      if (outSummary) {
        const row = {
          ok,
          status: ok ? EMOJI_SUCCESS : EMOJI_FAIL,
          script: script.id,
          prompt: usage?.prompt,
          completion: usage?.completion,
          total: usage?.total,
          duration: usage?.duration,
          error,
        };
        await appendFile(outSummary, objectToMarkdownTableRow(row, headers, { skipEscape: true }));
      }
      results.push({ ok, res, config, error });

      if (testDelay > 0) {
        logVerbose(`  waiting ${testDelay}s`);
        await delay(testDelay * 1000);
      }
    }
  } catch (e) {
    if (isCancelError(e)) logInfo(`test run cancelled`);
    else {
      logError(e);
      throw e;
    }
  }
  const runEnd = new Date();

  if (outSummary) {
    await appendFile(
      outSummary,
      [
        objectToMarkdownTableRow(
          {
            status: results.filter((r) => r.ok).length,
            prompt: stats.prompt,
            completion: stats.completion,
            total: stats.total,
            duration: roundWithPrecision((runEnd.getTime() - runStart.getTime()) / 1000, 1),
          },
          headers,
          { skipEscape: true },
        ),
        "\n\n",
        `- end: ${runEnd.toISOString()}\n`,
      ].join(""),
    );
  }
  if (outSummary) logVerbose(`trace: ${outSummary}`);
  const ok = results.every((r) => !!r.ok);
  return {
    ok,
    status: ok ? 0 : -1,
    value: results.map(({ ok, res, config }) => ({
      ok,
      error: res.error,
      status: res.status === "success" ? 0 : -1,
      script: config.script.id,
    })),
    error: results.find((r) => r.res.error)?.res.error,
  };
}

async function promptFooRunPromptScriptTests(
  ids: string[],
  options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    maxConcurrency?: string;
    testTimeout?: string;
    promptfoo?: boolean;
  } & CancellationOptions,
): Promise<PromptScriptTestRunResponse> {
  applyModelOptions(options, "cli");
  const { cancellationToken, redteam } = options || {};
  const scripts = await listTests({ ids, ...(options || {}) });
  if (!scripts.length)
    return {
      ok: false,
      status: FILES_NOT_FOUND_ERROR_CODE,
      error: serializeError(new Error("no tests found")),
    };

  const cli = options.cli || resolve(__filename);
  const out = options.out || join(GENAISCRIPT_FOLDER, "tests");
  let outSummary = options.outSummary ? resolve(options.outSummary) : undefined;
  const provider = join(out, "provider.mjs");
  const port = PROMPTFOO_REMOTE_API_PORT;
  const serverUrl = `http://127.0.0.1:${port}`;
  const testDelay = normalizeInt(options?.testDelay);
  const maxConcurrency = normalizeInt(options?.maxConcurrency);
  const timeout = normalizeInt(options?.testTimeout) * 1000 || undefined;
  const runStart = new Date();
  logInfo(`writing tests to ${out}`);

  if (options?.removeOut) await rmDir(out);
  await ensureDir(out);
  await writeFile(provider, promptFooDriver);

  if (!outSummary) {
    outSummary = dotGenaiscriptPath(
      TEST_RUNS_DIR_NAME,
      `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`,
    );
  }

  await ensureDir(PROMPTFOO_CACHE_PATH);
  await ensureDir(PROMPTFOO_CONFIG_DIR);
  if (outSummary) {
    await ensureDir(dirname(outSummary));
    await appendFile(
      outSummary,
      `## GenAIScript Test Results

- start: ${runStart.toISOString()}
- Run this command to launch the promptfoo test viewer.

\`\`\`sh
npx --yes genaiscript@${CORE_VERSION} test view
\`\`\`

`,
    );
    logVerbose(`trace: ${outSummary}`);
  }

  // Prepare test configurations for each script
  const optionsModels = Object.freeze(options.models?.map(parseModelSpec));
  const configurations: { script: PromptScript; configuration: string }[] = [];
  for (const script of scripts) {
    checkCancelled(cancellationToken);
    const fn = out
      ? join(out, `${script.id}.promptfoo.yaml`)
      : script.filename.replace(GENAI_ANY_REGEX, ".promptfoo.yaml");
    const { info: chatInfo } = await resolveModelConnectionInfo(script, {
      model: runtimeHost.modelAliases.large.model,
    });
    if (chatInfo.error) throw new Error(chatInfo.error);
    let { info: embeddingsInfo } = await resolveModelConnectionInfo(script, {
      model: runtimeHost.modelAliases.embeddings.model,
    });
    if (embeddingsInfo?.error) embeddingsInfo = undefined;
    const testModels = arrayify(script.testModels).map((m) =>
      typeof m === "string" ? parseModelSpec(m) : m,
    );
    const models = testModels?.length ? testModels : optionsModels?.slice(0);
    const config = await generatePromptFooConfiguration(script, {
      out,
      cli,
      models,
      provider: "provider.mjs",
      chatInfo,
      embeddingsInfo,
      redteam,
    });
    const yaml = YAMLStringify(config);
    await writeFile(fn, yaml);
    configurations.push({ script, configuration: fn });
  }

  const stats = {
    prompt: 0,
    completion: 0,
    total: 0,
  };
  const headers = ["status", "script", "prompt", "completion", "total", "duration", "url"];
  if (outSummary) {
    await appendFile(
      outSummary,
      [headersToMarkdownTableHead(headers), headersToMarkdownTableSeparator(headers)].join(""),
    );
  }
  const promptFooVersion = options.promptfooVersion || PROMPTFOO_VERSION;
  const results: PromptScriptTestResult[] = [];
  // Execute each configuration and gather results
  for (const config of configurations) {
    checkCancelled(cancellationToken);
    const { script, configuration } = config;
    logInfo(
      `test ${script.id} (${results.length + 1}/${configurations.length}) - ${configuration}`,
    );
    const testStart = new Date();
    const outJson = configuration.replace(/\.yaml$/, ".res.json");
    const cmd = "npx";
    const args = ["--yes", `promptfoo@${promptFooVersion}`];
    if (redteam) args.push("redteam", "run", "--force");
    else args.push("eval", "--no-progress-bar");
    args.push("--config", configuration);
    if (!isNaN(maxConcurrency)) args.push("--max-concurrency", String(maxConcurrency));

    if (options.cache) args.push("--cache");
    if (options.verbose) args.push("--verbose");
    args.push("--output", outJson);
    logVerbose(`  ${cmd} ${args.join(" ")}`);
    const exec = execa(cmd, args, {
      preferLocal: true,
      cleanup: true,
      stripFinalNewline: true,
      buffer: false,
      env: createEnv(),
      stdio: "inherit",
      timeout,
    });
    let status: number;
    let error: SerializedError;
    let value: PromptScriptTestResult["value"] = undefined;
    try {
      const res = await exec;
      status = res.exitCode;
    } catch (e) {
      status = e.errno ?? -1;
      error = serializeError(e);
    }
    if (await tryStat(outJson)) value = JSON5TryParse(await readFile(outJson, "utf8"));
    const ok = status === 0;
    stats.prompt += value?.results?.stats?.tokenUsage?.prompt || 0;
    stats.completion += value?.results?.stats?.tokenUsage?.completion || 0;
    stats.total += value?.results?.stats?.tokenUsage?.total || 0;
    const testEnd = new Date();
    if (outSummary) {
      const url = value?.evalId
        ? " " +
          link("result", `${serverUrl}/eval?evalId=${encodeURIComponent(value?.evalId)}`) +
          " "
        : "";
      const row = {
        status: ok ? EMOJI_SUCCESS : EMOJI_FAIL,
        script: script.id,
        prompt: value?.results?.stats?.tokenUsage?.prompt,
        completion: value?.results?.stats?.tokenUsage?.completion,
        total: value?.results?.stats?.tokenUsage?.total,
        duration: roundWithPrecision((testEnd.getTime() - testStart.getTime()) / 1000, 1),
        url,
      };
      await appendFile(outSummary, objectToMarkdownTableRow(row, headers, { skipEscape: true }));
    }
    results.push({
      status,
      ok,
      error,
      script: script.id,
      value,
    });

    if (testDelay > 0) {
      logVerbose(`  waiting ${testDelay}s`);
      await delay(testDelay * 1000);
    }
  }
  const runEnd = new Date();

  if (outSummary) {
    await appendFile(
      outSummary,
      [
        objectToMarkdownTableRow(
          {
            status: results.filter((r) => r.ok).length,
            prompt: stats.prompt,
            completion: stats.completion,
            total: stats.total,
            duration: roundWithPrecision((runEnd.getTime() - runStart.getTime()) / 1000, 1),
          },
          headers,
          { skipEscape: true },
        ),
        "\n\n",
        `- end: ${runEnd.toISOString()}\n`,
      ].join(""),
    );
  }
  if (outSummary) logVerbose(`trace: ${outSummary}`);
  const ok = results.every((r) => !!r.ok);
  return {
    ok,
    status: ok ? 0 : -1,
    value: results,
    error: results.find((r) => r.error)?.error,
  };
}

/*
 * Lists test scripts based on given options, filtering by IDs and groups.
 * @param options - Options to filter the test scripts by IDs or groups.
 * @returns A Promise resolving to an array of filtered scripts.
 */
async function listTests(options: {
  ids?: string[];
  groups?: string[];
  redteam?: boolean;
}): Promise<PromptScript[]> {
  const prj = await buildProject();
  const scripts = filterScripts(prj.scripts, {
    ...(options || {}),
    test: options.redteam ? undefined : true,
    redteam: options.redteam,
  });
  return scripts;
}

/**
 * Executes prompt script tests, outputs the results, and exits the process with a status code.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run, including output paths, CLI settings, verbosity, caching, test delay, groups, concurrency settings, and redteam mode.
 */
export async function scriptsTest(
  ids: string[],
  options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    groups?: string[];
    maxConcurrency?: string;
  },
) {
  const canceller = createCancellationController();
  const cancellationToken = canceller.token;

  const { status, value = [] } = await runPromptScriptTests(ids, { ...options, cancellationToken });
  const trace = new MarkdownTrace();
  trace.appendContent(
    `\n\ntests: ${value.filter((r) => r.ok).length} success, ${value.filter((r) => !r.ok).length} failed\n\n`,
  );
  for (const result of value) trace.resultItem(result.ok, result.script);
  console.log("");
  console.log(trace.content);
  process.exit(status);
}

/**
 * Lists available test scripts and prints their IDs and filenames.
 * Filters the scripts based on the provided options.
 *
 * @param options - Options to filter the scripts by groups or redteam flag.
 * Filters the scripts by groups and whether they are for redteam testing.
 */
export async function scriptTestList(options: { groups?: string[]; redteam?: boolean }) {
  const scripts = await listTests(options);
  console.log(scripts.map((s) => toStringList(s.id, s.filename)).join("\n"));
}

/**
 * Launches a server to view promptfoo test results.
 * Ensures necessary directories are created before starting the server.
 * Logs a debug message before launching the server.
 * Executes the command to start the server using the specified or default promptfoo version.
 * @param options - Options to specify the promptfoo version.
 */
export async function scriptTestsView(options: { promptfooVersion?: string }) {
  await ensureDir(PROMPTFOO_CACHE_PATH);
  await ensureDir(PROMPTFOO_CONFIG_DIR);
  const cmd = `npx`;
  const args = [
    "--yes",
    `promptfoo@${options.promptfooVersion || PROMPTFOO_VERSION}`,
    "view",
    "-y",
  ];
  console.debug(`launching promptfoo result server`);
  await execa(cmd, args, {
    cleanup: true,
    env: createEnv(),
    stdio: "inherit",
  });
}
