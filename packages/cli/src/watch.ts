// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FSWatcher, watch } from "chokidar";
import { basename, resolve } from "node:path";
import {
  CHANGE,
  CLOSE,
  GENAI_ANY_REGEX,
  OPEN,
  createGitIgnorer,
  filterScripts,
  logError,
  toSignal,
} from "@genaiscript/core";
import type {
  CancellationOptions,
  ElementOrArray,
  Project,
  PromptScript,
  ScriptFilterOptions,
} from "@genaiscript/core";
import { genaiscriptDebug } from "@genaiscript/core";
import { buildProject } from "@genaiscript/core";
const dbg = genaiscriptDebug("watch");

interface ProjectWatcherOptions extends ScriptFilterOptions {
  paths: ElementOrArray<string>;
  cwd: string;
}

export class ProjectWatcher extends EventTarget {
  private _watcher: FSWatcher;
  private _project: Project;
  private _scripts: PromptScript[];

  constructor(readonly options: ProjectWatcherOptions & CancellationOptions) {
    super();
    const signal = toSignal(this.options.cancellationToken);
    signal?.addEventListener("abort", this.close.bind(this));
  }

  get cwd() {
    return this.options.cwd;
  }

  async open() {
    if (this._watcher) return;

    dbg(`starting`);
    await this.refresh();
    const { paths, cwd } = this.options;
    const gitIgnorer = await createGitIgnorer();
    // Initialize watcher.
    this._watcher = watch(paths, {
      ignored: (path, stats) => {
        if (!stats) return false;
        if (stats.isDirectory()) {
          const b = basename(path);
          if (/^\./.test(b)) return true;
        } else if (stats.isFile() && !GENAI_ANY_REGEX.test(path)) {
          return true;
        }
        const filtered = gitIgnorer([path]);
        if (filtered.length === 0) return true;
        return false;
      },
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 1000,
      },
      atomic: true,
      interval: 1000,
      binaryInterval: 5000,
      depth: 30,
      cwd,
    });
    const changed = () => {
      dbg(`changed`);
      this.dispatchEvent(new Event(CHANGE));
    };
    this._watcher
      .on("error", (error) => logError(`watch: ${error}`))
      .on("add", changed)
      .on("change", changed)
      .on("unlink", changed);
    this.addEventListener(CHANGE, this.refresh.bind(this));
    this.dispatchEvent(new Event(OPEN));
  }

  private async refresh() {
    this._project = undefined;
  }

  async project() {
    if (!this._project) {
      dbg(`building project`);
      this._project = await buildProject();
    }
    return this._project;
  }

  async scripts() {
    if (!this._scripts) {
      const project = await this.project();
      this._scripts = filterScripts(project.scripts, this.options);
    }
    return this._scripts?.slice(0);
  }

  async close() {
    dbg(`closing`);
    await this._watcher?.close();
    this._watcher = undefined;
    this.dispatchEvent(new Event(CLOSE));
  }
}

/**
 * Starts a file watcher for a project, monitoring specified paths and reacting to changes.
 *
 * @param options - Optional configuration object:
 *   - paths: One or more paths to watch. Defaults to the current directory.
 *   - cwd: The current working directory for the watcher. Defaults to the resolved current directory.
 *   - cancellationToken: A token to signal cancellation of the watcher.
 *   - rest: Additional options including script filtering options.
 * @returns An initialized ProjectWatcher instance.
 */
export async function startProjectWatcher(
  options?: ScriptFilterOptions & {
    paths?: ElementOrArray<string>;
    cwd?: string;
  } & CancellationOptions,
) {
  const { paths = ".", cwd = resolve("."), ...rest } = options || {};
  const watcher = new ProjectWatcher({ paths, cwd, ...rest });
  await watcher.open();
  return watcher;
}
