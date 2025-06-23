// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, {
  createContext,
  startTransition,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { GenerationResult, PromptScriptRunOptions } from "../../core/src/server/messages";
import { toBase64 } from "../../core/src/base64";
import { isBinaryMimeType } from "../../core/src/binary";
import { fetchRun } from "./api";
import { RunClient } from "./RunClient";
import { useRunClient } from "./RunClientContext";
import { useEventListener } from "./useEventListener";
import { useLocationHashValue } from "./useLocationHashValue";
import { useScriptId } from "./ScriptContext";
import { ImportedFile } from "./types";
import { generateId } from "../../core/src/id";

export const RunnerContext = createContext<{
  runId: string | undefined;
  run: (
    files: string[],
    importedFiles: ImportedFile[],
    parameters: PromptParameters,
    options: Partial<PromptScriptRunOptions>,
  ) => Promise<void>;
  cancel: () => void;
  state: "running" | undefined;
  result: Partial<GenerationResult> | undefined;
  trace: string;
  output: string;
  loadRunResult: (runId: string) => void;
} | null>(null);

export function RunnerProvider({ children }: { children: React.ReactNode }) {
  const { client } = useRunClient();
  const { scriptid } = useScriptId();

  const [state, setState] = useState<"running" | undefined>(undefined);
  const [runId, setRunId] = useLocationHashValue("runid");
  const [result, setResult] = useState<Partial<GenerationResult> | undefined>(client.result);
  const [trace, setTrace] = useState<string>(client.trace);
  const [output, setOutput] = useState<string>(client.output);

  const start = useCallback((e: Event) => {
    const ev = e as CustomEvent;
    setRunId(ev.detail.runId);
  }, []);
  useEventListener(client, RunClient.SCRIPT_START_EVENT, start, false);

  const runUpdate = useCallback(
    (e: Event) =>
      startTransition(() => {
        setRunId(client.runId);
        setState("running");
      }),
    [client],
  );
  useEventListener(client, RunClient.RUN_EVENT, runUpdate, false);

  const end = useCallback(
    (e: Event) =>
      startTransition(() => {
        setState(undefined);
        if (runId === client.runId) setResult(client.result);
      }),
    [client, runId],
  );
  useEventListener(client, RunClient.SCRIPT_END_EVENT, end, false);

  const appendTrace = useCallback(
    (evt: Event) =>
      startTransition(() => {
        setTrace(() => client.trace);
        setOutput(() => client.output);
      }),
    [],
  );
  useEventListener(client, RunClient.PROGRESS_EVENT, appendTrace);

  const run = async (
    files: string[],
    importedFiles: ImportedFile[],
    parameters: PromptParameters,
    options: Partial<PromptScriptRunOptions>,
  ) => {
    if (!scriptid) return;

    const runId = generateId();
    const workspaceFiles = await Promise.all(
      importedFiles
        .filter(({ selected }) => selected)
        .map(async (f) => {
          const binary = isBinaryMimeType(f.type);
          const buffer = binary ? new Uint8Array(await f.arrayBuffer()) : undefined;
          const content = buffer ? toBase64(buffer) : await f.text();
          return {
            filename: f.path || f.relativePath,
            type: f.type,
            encoding: binary ? "base64" : undefined,
            content,
            size: f.size,
          } satisfies WorkspaceFile;
        }),
    );
    client.startScript(runId, scriptid, files, {
      ...(options || {}),
      vars: parameters,
      workspaceFiles,
    });
    setResult(undefined);
  };

  const cancel = () => {
    client.abortScript(runId, "ui cancel");
    setRunId(undefined);
    setState(undefined);
  };

  const loadRunResult = async (runId: string) => {
    if (!runId) return;
    const res = await fetchRun(runId);
    if (res)
      startTransition(() => {
        client.cancel("load run");
        setRunId(runId);
        setResult(res.result);
        setTrace(res.trace);
        setOutput(res.result?.text);
        setState(undefined);
      });
  };

  useEffect(() => {
    if (runId) loadRunResult(runId);
  }, []);

  return (
    <RunnerContext.Provider
      value={{
        runId,
        run,
        cancel,
        state,
        result,
        trace,
        output,
        loadRunResult,
      }}
    >
      {children}
    </RunnerContext.Provider>
  );
}

export function useRunner() {
  const runner = use(RunnerContext);
  if (!runner) throw new Error("runner context not configured");
  return runner;
}

export function useResult(): Partial<GenerationResult> | undefined {
  const { result } = useRunner();
  return result;
}

export function useTrace() {
  const { trace } = useRunner();
  return trace;
}

export function useOutput() {
  const { output } = useRunner();
  return output;
}
