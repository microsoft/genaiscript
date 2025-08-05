// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import process from "node:process";
import { dedent, deleteUndefinedValues, dotGenaiscriptPath, genaiscriptDebug, hash, PLimitPromiseQueue, stderr, } from "@genaiscript/core";
const dbg = genaiscriptDebug("pyodide");
class PyProxy {
    runtime;
    proxy;
    constructor(runtime, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proxy) {
        this.runtime = runtime;
        this.proxy = proxy;
    }
    get(name) {
        return toJs(this.proxy.get(name));
    }
    set(name, value) {
        const p = this.runtime.toPy(value);
        this.proxy.set(name, p);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJs(res) {
    return typeof res?.toJs === "function" ? res.toJs() : res;
}
class PyodideRuntime {
    version;
    runtime;
    queue = new PLimitPromiseQueue(1);
    micropip;
    constructor(version, runtime) {
        this.version = version;
        this.runtime = runtime;
    }
    get globals() {
        return new PyProxy(this.runtime, this.runtime.globals);
    }
    async import(pkg) {
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
    async run(code) {
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
export async function createPythonRuntime(options) {
    const { cache } = options ?? {};
    dbg(`creating runtime`);
    const { loadPyodide, version } = await import("pyodide");
    dbg(`version: %s`, version);
    const sha = await hash({ cache, version: true, pyodide: version });
    //const installDir = dirname(moduleResolve("pyodide"));
    const packageCacheDir = dotGenaiscriptPath("cache", "python", sha);
    dbg("package cache dir: %s", packageCacheDir);
    //dbg("install dir: %s", installDir);
    const pyodide = await loadPyodide(deleteUndefinedValues({
        packageCacheDir,
        stdout: (msg) => stderr.write(msg),
        stderr: (msg) => stderr.write(msg),
        checkAPIVersion: true,
    }));
    dbg(`mounting %s at /workspace`, process.cwd());
    await pyodide.mountNodeFS("/workspace", process.cwd());
    dbg(`runtime ready`);
    return new PyodideRuntime(version, pyodide);
}
//# sourceMappingURL=pyodide.js.map