"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPythonRuntime = createPythonRuntime;
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const node_process_1 = __importDefault(require("node:process"));
const core_1 = require("@genaiscript/core");
const dbg = (0, core_1.genaiscriptDebug)("pyodide");
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
    queue = new core_1.PLimitPromiseQueue(1);
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
            const d = (0, core_1.dedent)(code);
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
async function createPythonRuntime(options) {
    const { cache } = options ?? {};
    dbg(`creating runtime`);
    const { loadPyodide, version } = await import("pyodide");
    dbg(`version: %s`, version);
    const sha = await (0, core_1.hash)({ cache, version: true, pyodide: version });
    //const installDir = dirname(moduleResolve("pyodide"));
    const packageCacheDir = (0, core_1.dotGenaiscriptPath)("cache", "python", sha);
    dbg("package cache dir: %s", packageCacheDir);
    //dbg("install dir: %s", installDir);
    const pyodide = await loadPyodide((0, core_1.deleteUndefinedValues)({
        packageCacheDir,
        stdout: (msg) => core_1.stderr.write(msg),
        stderr: (msg) => core_1.stderr.write(msg),
        checkAPIVersion: true,
    }));
    dbg(`mounting %s at /workspace`, node_process_1.default.cwd());
    await pyodide.mountNodeFS("/workspace", node_process_1.default.cwd());
    dbg(`runtime ready`);
    return new PyodideRuntime(version, pyodide);
}
//# sourceMappingURL=pyodide.js.map