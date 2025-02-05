import type { PyodideInterface } from "pyodide"
import { dotGenaiscriptPath } from "./util"
import { TraceOptions } from "./trace"
import { hash } from "./crypto"
import { deleteUndefinedValues } from "./cleaners"
import { dedent } from "./indent"

class PyodideRuntime implements PythonRuntime {
    private micropip: { install: (packageName: string) => Promise<void> }

    constructor(
        public readonly version: string,
        public readonly runtime: PyodideInterface
    ) {}

    async import(pkg: string) {
        if (!this.micropip) {
            await this.runtime.loadPackage("micropip")
            this.micropip = this.runtime.pyimport("micropip")
        }
        await this.micropip.install(pkg)
    }

    async run(code: string): Promise<any> {
        const d = dedent(code)
        const res = await this.runtime.runPythonAsync(d)
        const r = typeof res?.toJs === "function" ? res.toJs() : res
        return r
    }
}

export async function createPythonRuntime(
    options?: PythonRuntimeOptions & TraceOptions
): Promise<PythonRuntime> {
    const { cache, workspaceFs } = options ?? {}
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
    if (workspaceFs) {
        const mountDir = "/mnt"
        await pyodide.FS.mkdirTree(mountDir)
        await pyodide.FS.mount(
            pyodide.FS.filesystems.NODEFS,
            { root: process.cwd() },
            mountDir
        )
    }
    return new PyodideRuntime(version, pyodide)
}
