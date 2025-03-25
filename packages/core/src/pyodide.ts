import type { PyodideInterface } from "pyodide"
import { dotGenaiscriptPath } from "./workdir"
import { TraceOptions } from "./trace"
import { hash } from "./crypto"
import { deleteUndefinedValues } from "./cleaners"
import { dedent } from "./indent"
import { PLimitPromiseQueue } from "./concurrency"
import { stderr } from "./stdio"

class PyProxy implements PythonProxy {
    constructor(
        readonly runtime: PyodideInterface,
        readonly proxy: any
    ) {}

    get<T>(name: string): T {
        return toJs(this.proxy.get(name))
    }

    set<T>(name: string, value: T) {
        const p = this.runtime.toPy(value)
        this.proxy.set(name, p)
    }
}

function toJs(res: any) {
    return typeof res?.toJs === "function" ? res.toJs() : res
}

class PyodideRuntime implements PythonRuntime {
    private queue: PLimitPromiseQueue = new PLimitPromiseQueue(1)
    private micropip: { install: (packageName: string) => Promise<void> }

    constructor(
        public readonly version: string,
        public readonly runtime: PyodideInterface
    ) {}

    get globals(): PythonProxy {
        return new PyProxy(this.runtime, this.runtime.globals)
    }

    async import(pkg: string) {
        await this.queue.add(async () => {
            if (!this.micropip) {
                await this.runtime.loadPackage("micropip")
                this.micropip = this.runtime.pyimport("micropip")
            }
            await this.micropip.install(pkg)
        })
    }

    async run(code: string): Promise<any> {
        return await this.queue.add(async () => {
            const d = dedent(code)
            const res = await this.runtime.runPythonAsync(d)
            const r = toJs(res)
            return r
        })
    }
}

/**
* """
* Creates a Python runtime environment using Pyodide.
* 
* This function initializes the Pyodide environment by loading the necessary
* packages and setting up a working directory. It also handles output
* streaming for standard output and error messages.
* 
* Parameters:
* - options: An optional configuration object that can include cache settings.
* 
* Returns:
* A promise that resolves to an instance of the PythonRuntime, which
* provides methods for importing packages and executing Python code.
* """
*/
export async function createPythonRuntime(
    options?: PythonRuntimeOptions & TraceOptions
): Promise<PythonRuntime> {
    const { cache } = options ?? {}
    const { loadPyodide, version } = await import("pyodide")
    const sha = await hash({ cache, version: true, pyodide: version })
    const pyodide = await loadPyodide(
        deleteUndefinedValues({
            packageCacheDir: dotGenaiscriptPath("cache", "python", sha),
            stdout: (msg: string) => stderr.write(msg),
            stderr: (msg: string) => stderr.write(msg),
            checkAPIVersion: true,
        })
    )
    await pyodide.mountNodeFS("/workspace", process.cwd())
    return new PyodideRuntime(version, pyodide)
}
