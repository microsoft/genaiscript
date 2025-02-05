import type { PyodideInterface } from "pyodide"
import { dotGenaiscriptPath } from "./util"
import { TraceOptions } from "./trace"
import { hash } from "./crypto"
import { deleteUndefinedValues } from "./cleaners"
import { dedent } from "./indent"

export interface PythonRuntime {
    run(code: string): Promise<any>
    import(pkg: string): Promise<void>
}

class PyodideRuntime implements PythonRuntime {
    private runtime: PyodideInterface
    private micropip: { install: (packageName: string) => Promise<void> }

    constructor(pyodide: PyodideInterface) {
        this.runtime = pyodide
    }

    async import(pkg: string) {
        if (!this.micropip) {
            await this.runtime.loadPackage("micropip")
            this.micropip = this.runtime.pyimport("micropip")
        }
        await this.micropip.install(pkg)
    }

    async run(code: string): Promise<any> {
        const d = dedent(code)
        const res = this.runtime.runPython(d)
        const r = typeof res?.toJs === "function" ? res.toJs() : res
        return res
    }
}

export async function createPythonRuntime(
    options?: {} & TraceOptions
): Promise<PythonRuntime> {
    const { loadPyodide, version } = await import("pyodide")
    const sha = await hash({ version: true, pyodide: version })
    const pyodide = await loadPyodide(
        deleteUndefinedValues({
            packageCacheDir: dotGenaiscriptPath("cache", "python", sha),
            stdout: (msg: string) => process.stderr.write(msg),
            stderr: (msg: string) => process.stderr.write(msg),
        })
    )
    return new PyodideRuntime(pyodide)
}
