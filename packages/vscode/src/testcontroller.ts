// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import type { ExtensionState } from "./state";
import { arrayify } from "../../core/src/cleaners";
import { TOOL_ID, CHANGE, EMOJI_SUCCESS, EMOJI_FAIL } from "../../core/src/constants";
import { errorMessage } from "../../core/src/error";
import type { PromptScript } from "../../core/src/types";

export async function activateTestController(state: ExtensionState) {
  const { context, host } = state;
  const { subscriptions } = context;

  const ctrl = vscode.tests.createTestController(TOOL_ID, "GenAIScript");
  subscriptions.push(ctrl);

  // UI button
  ctrl.refreshHandler = async (token) => {
    await state.parseWorkspace();
    if (token?.isCancellationRequested) return;
    refreshTests(token);
  };

  // First, create the `resolveHandler`. This may initially be called with
  // "undefined" to ask for all tests in the workspace to be discovered, usually
  // when the user opens the Test Explorer for the first time.
  ctrl.resolveHandler = async (testToResolve) => {
    if (!vscode.workspace.workspaceFolders) return; // handle the case of no open folders

    if (testToResolve) {
      const script = state.project.scripts.find(
        (script) =>
          vscode.workspace.asRelativePath(script.filename) ===
          vscode.workspace.asRelativePath(testToResolve.uri),
      );
      await getOrCreateFile(script);
    } else {
      await refreshTests();
      state.addEventListener(CHANGE, () => refreshTests());
    }
  };

  const refreshTests = async (token?: vscode.CancellationToken) => {
    if (!state.project) await state.parseWorkspace();
    if (token?.isCancellationRequested) return;
    const scripts = state.project.scripts.filter((t) => arrayify(t.tests)?.length) || [];
    // refresh existing
    for (const script of scripts) {
      getOrCreateFile(script);
    }
    // remove deleted tests
    for (const [id] of Array.from(ctrl.items)) {
      if (!scripts.find((s) => s.id === id)) ctrl.items.delete(id);
    }
  };

  const runProfile = ctrl.createRunProfile(
    "Run",
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      const { include = [], exclude = [] } = request;
      const run = ctrl.createTestRun(request);

      // collect tests
      const tests = new Set<vscode.TestItem>();
      if (include?.length) include.forEach((t) => tests.add(t));
      else ctrl.items.forEach((t) => tests.add(t));
      for (const test of exclude) tests.delete(test);

      // notify ui that the tests are enqueued
      tests.forEach((t) => run.enqueued(t));

      // collect scripts
      const project = state.project;
      if (!state.project) await state.parseWorkspace();

      const scripts = Array.from(tests)
        .map((test) => ({
          test,
          script: project.scripts.find((s) => s.id === test.id),
        }))
        .filter(({ script }) => script);

      if (!scripts.length) {
        run.end();
        return;
      }

      const client = await state.host.server.client();
      await client.init();
      try {
        for (const { script, test } of scripts) {
          // check for cancellation
          if (token.isCancellationRequested) {
            run.end();
            return;
          }
          run.started(test);
          const res = await client.runTest(script);
          for (const r of res.value || []) {
            run.appendOutput(
              `${r.ok ? EMOJI_SUCCESS : EMOJI_FAIL} ${r.script} ${errorMessage(r.error) || ""}`,
              undefined,
              test,
            );
          }
          if (res.error) run.failed(test, new vscode.TestMessage(errorMessage(res.error)));
          else run.passed(test);
        }
      } finally {
        run.end();
      }
    },
  );
  subscriptions.push(runProfile);

  function getOrCreateFile(script: PromptScript) {
    const existing = ctrl.items.get(script.id);
    if (existing) return existing;

    const file = ctrl.createTestItem(script.id, script.id, host.toUri(script.filename));
    file.description = script.title ?? script.description;
    ctrl.items.add(file);
    return file;
  }
}
