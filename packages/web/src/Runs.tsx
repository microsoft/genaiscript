// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { Suspense } from "react";
import { useRunner } from "./RunnerContext";
import { RunsProvider, useRunResults } from "./RunsContext";
import { useScriptId } from "./ScriptContext";

import "@vscode-elements/elements/dist/vscode-form-container";
import "@vscode-elements/elements/dist/vscode-form-group";
import "@vscode-elements/elements/dist/vscode-form-helper";
import "@vscode-elements/elements/dist/vscode-label";
import "@vscode-elements/elements/dist/vscode-single-select";
import "@vscode-elements/elements/dist/vscode-option";

function RunResultSelect() {
  const { loadRunResult } = useRunner();
  const { runs } = useRunResults() || {};
  const { scriptid } = useScriptId();
  const handleSelect = (e: Event) => {
    e.stopPropagation();
    const target = e.target as HTMLSelectElement;
    const runId = target?.value;
    loadRunResult(runId);
  };

  return (
    <vscode-form-group>
      <vscode-label>Runs</vscode-label>
      <vscode-single-select onvsc-change={handleSelect}>
        <vscode-option description="" value=""></vscode-option>
        {runs
          ?.filter((r) => !scriptid || r.scriptId === scriptid)
          .map((run) => (
            <vscode-option
              description={`${run.scriptId}, created at ${run.creationTime} (${run.runId})`}
              value={run.runId}
            >
              {scriptid === run.scriptId ? "" : `${run.scriptId}, `}
              {run.creationTime}
            </vscode-option>
          ))}
      </vscode-single-select>
      <vscode-form-helper>Select a previous run</vscode-form-helper>
    </vscode-form-group>
  );
}

export function RunResultSelector() {
  return (
    <RunsProvider>
      <Suspense>
        <RunResultSelect />
      </Suspense>
    </RunsProvider>
  );
}
