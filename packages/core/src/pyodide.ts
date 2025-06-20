// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { PyodideInterface } from "pyodide";
import { dotGenaiscriptPath } from "./workdir.js";
import { TraceOptions } from "./trace.js";
import { hash } from "./crypto.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { dedent } from "./indent.js";
import { PLimitPromiseQueue } from "./concurrency.js";
import { stderr } from "./stdio.js";
import type { PythonRuntime, PythonRuntimeOptions } from "./types.js";
import { loadPyodide, version } from "pyodide";
import { moduleResolve } from "./pathUtils.js";
import { genaiscriptDebug } from "./debug.js";
import { dirname } from "node:path";
const dbg = genaiscriptDebug("pyodide");

class PyProxy implements PythonProxy {
  constructor(
    readonly runtime: PyodideInterface,
    readonly proxy: any,
  ) {}

  get<T>(name: string): T {
    return toJs(this.proxy.get(name));
  }

  set<T>(name: string, value: T) {
    const p = this.runtime.toPy(value);
    this.proxy.set(name, p);
  }
}

function toJs(res: any) {
  return typeof res?.toJs === "function" ? res.toJs() : res;
}

class PyodideRuntime implements PythonRuntime {
  private queue: PLimitPromiseQueue = new PLimitPromiseQueue(1);
  private micropip: { install: (packageName: string) => Promise<void> };

  constructor(
    public readonly version: string,
    public readonly runtime: PyodideInterface,
  ) {}

  get globals(): PythonProxy {
    return new PyProxy(this.runtime, this.runtime.globals);
  }

  async import(pkg: string) {
    await this.queue.add(async () => {
      if (!this.micropip) {
        dbg(`loading micropip`);
        await this.runtime.loadPackage("micropip");
        this.micropip = this.runtime.pyimport("micropip");
      }
      dbg(`install %s`, pkg);
      await this.micropip.install(pkg);
    });
  }

  async run(code: string): Promise<any> {
    return await this.queue.add(async () => {
      const d = dedent(code);
      dbg(`running code: %s`, d);
      const res = await this.runtime.runPythonAsync(d);
      const r = toJs(res);
      return r;
    });
  }
}

/**
 * Creates and initializes a Python runtime environment using Pyodide.
 *
 * @param options - Optional settings to configure the Python runtime and tracing behavior.
 *   - cache: Controls caching behavior for loaded Python packages.
 *   - trace options: Options for enabling and handling tracing during runtime operations.
 * @returns A Promise resolving to an instance of the Python runtime environment.
 *
 * The function sets up Pyodide, configures caching, handles package installations,
 * and mounts the current workspace directory. The created runtime allows execution
 * of Python code and interaction with Python globals.
 */
export async function createPythonRuntime(
  options?: PythonRuntimeOptions & TraceOptions,
): Promise<PythonRuntime> {
  const { cache } = options ?? {};
  dbg(`creating runtime`);
  const sha = await hash({ cache, version: true, pyodide: version });
  const installDir = dirname(moduleResolve("pyodide"));
  const packageCacheDir = dotGenaiscriptPath("cache", "python", sha)
  dbg("package cache dir: %s", packageCacheDir);
  dbg("install dir: %s", installDir);
  const pyodide = await loadPyodide(
    deleteUndefinedValues({
      packageCacheDir,
      stdout: (msg: string) => stderr.write(msg),
      stderr: (msg: string) => stderr.write(msg),
      checkAPIVersion: true,
    }),
  );
  dbg(`mounting %s at /workspace`, process.cwd());
  await pyodide.mountNodeFS("/workspace", process.cwd());
  dbg(`runtime ready`);
  return new PyodideRuntime(version, pyodide);
}
