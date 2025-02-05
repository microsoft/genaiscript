import type { PyodideInterface } from "pyodide"
import { dotGenaiscriptPath } from "./util"
import { TraceOptions } from "./trace"
import { hash } from "./crypto"
import { deleteUndefinedValues } from "./cleaners"
import { dedent } from "./indent"
import { PLimitPromiseQueue } from "./concurrency"

class PyProxy implements PythonProxy {
    constructor(
        readonly runtime: PyodideInterface,
        readonly proxy: any
    ) {}

    get<T>(name: string): T {
        return toJs(this.proxy[name])
    }

    set<T>(name: string, value: T) {
        const p = this.runtime.toPy(value)
        this.proxy[name] = p
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

export async function createPythonRuntime(
    options?: PythonRuntimeOptions & TraceOptions
): Promise<PythonRuntime> {
    const { cache } = options ?? {}
    const { loadPyodide, version } = await import("pyodide")
    const sha = await hash({ cache, version: true, pyodide: version })
    const pyodide = await loadPyodide(
        deleteUndefinedValues({
            packageCacheDir: dotGenaiscriptPath("cache", "python", sha),
            stdout: (msg: string) => process.stderr.write(msg),
            stderr: (msg: string) => process.stderr.write(msg),
            checkAPIVersion: true,
        })
    )
    await pyodide.mountNodeFS("/workspace", process.cwd())
    return new PyodideRuntime(version, pyodide)
}
