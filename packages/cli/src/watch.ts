import { FSWatcher, watch } from "chokidar"
import { resolve } from "node:path"
import {
    CHANGE,
    CLOSE,
    GENAI_ANYJS_GLOB,
    OPEN,
    READY,
} from "../../core/src/constants"
import { createGitIgnorer } from "../../core/src/gitignore"
import { tsImport } from "tsx/esm/api"
import { Project } from "../../core/src/server/messages"
import { buildProject } from "./build"
import { filterScripts, ScriptFilterOptions } from "../../core/src/ast"
import { CancellationOptions, toSignal } from "../../core/src/cancellation"

interface ProjectWatcherOptions extends ScriptFilterOptions {
    paths: ElementOrArray<string>
    cwd: string
}

export class ProjectWatcher extends EventTarget {
    private watcher: FSWatcher
    private _project: Project
    private _scripts: PromptScript[]

    constructor(readonly options: ProjectWatcherOptions & CancellationOptions) {
        super()
        this.watcher = watch(this.options.paths, {
            ...options,
            persistent: false,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 1000,
            },
            atomic: true,
            interval: 1000,
            binaryInterval: 5000,
            depth: 10,
        })
        const signal = toSignal(this.options.cancellationToken)
        signal?.addEventListener("abort", this.close.bind(this))
    }

    async open() {
        if (this.watcher) return

        this.refresh()
        const { paths, cwd } = this.options
        const gitIgnorer = await createGitIgnorer()
        // Initialize watcher.
        this.watcher = watch(paths, {
            ignored: (filename: string) => {
                const res = gitIgnorer([filename])
                return res.includes(filename)
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
            depth: 10,
            cwd,
        })
        const changed = () => this.dispatchEvent(new Event(CHANGE))
        this.watcher
            .on("add", changed)
            .on("change", changed)
            .on("unlink", changed)
        this.addEventListener(CHANGE, this.refresh.bind(this))
        this.dispatchEvent(new Event(OPEN))
    }

    private async refresh() {
        this._project = undefined
    }

    async project() {
        if (!this._project) this._project = await buildProject()
        return this._project
    }

    async scripts() {
        if (!this._scripts) {
            const project = await this.project()
            this._scripts = filterScripts(project.scripts, this.options)
        }
        return this._scripts?.slice(0)
    }

    async close() {
        await this.watcher?.close()
        this.watcher = undefined
        this.dispatchEvent(new Event(CLOSE))
    }
}

export async function startProjectWatcher(
    options?: ScriptFilterOptions & {
        paths?: ElementOrArray<string>
        cwd?: string
    } & CancellationOptions
) {
    const {
        paths = GENAI_ANYJS_GLOB,
        cwd = resolve("."),
        ...rest
    } = options || {}
    const watcher = new ProjectWatcher({ paths, cwd, ...rest })
    await watcher.open()
    return watcher
}
