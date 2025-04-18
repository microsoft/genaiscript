import * as vscode from "vscode"
import { createNodePath } from "../../core/src/path"
import { TerminalServerManager } from "./servermanager"
import { Uri } from "vscode"
import { ExtensionState } from "./state"
import { Utils } from "vscode-uri"
import { filterGitIgnore } from "../../core/src/gitignore"
import { setHost, Host } from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import { arrayify } from "../../core/src/util"
import { uniq } from "es-toolkit"
import { CancellationOptions } from "../../core/src/cancellation"
import {
    LanguageModelConfiguration,
    LogLevel,
} from "../../core/src/server/messages"

export class VSCodeHost extends EventTarget implements Host {
    userState: any = {}
    readonly path = createNodePath()
    readonly server: TerminalServerManager
    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        this.server = new TerminalServerManager(state)
        this.state.context.subscriptions.push(this)
    }

    async activate() {}

    get context() {
        return this.state.context
    }
    dispose() {
        setHost(undefined)
    }

    createUTF8Decoder() {
        return new TextDecoder("utf-8")
    }
    createUTF8Encoder() {
        return new TextEncoder()
    }
    get projectUri() {
        return vscode.workspace.workspaceFolders[0]?.uri
    }
    projectFolder(): string {
        return this.projectUri?.fsPath ?? "."
    }
    installFolder(): string {
        return this.context.extensionUri.fsPath
    }
    resolvePath(...segments: string[]): string {
        if (segments.length === 0) return "."
        const s0 = segments.shift()
        let r = vscode.Uri.file(s0)
        if (segments.length) r = Utils.resolvePath(r, ...segments)
        return r.fsPath
    }

    toUri(filenameOrUrl: string): vscode.Uri {
        const folder = this.projectUri
        if (!filenameOrUrl) return folder
        if (/^[a-z][a-z0-9+\-.]*:\/\//.test(filenameOrUrl))
            return vscode.Uri.parse(filenameOrUrl, true)
        if (this.path.isAbsolute(filenameOrUrl))
            return vscode.Uri.file(filenameOrUrl)
        else return Utils.resolvePath(folder, filenameOrUrl)
    }

    log(level: LogLevel, msg: string): void {
        const output = this.state.output
        switch (level) {
            case "error":
                output.error(msg)
                break
            case "warn":
                output.warn(msg)
                break
            case "debug":
                output.debug(msg)
                break
            default:
                output.info(msg)
                break
        }
    }
    async statFile(name: string): Promise<{
        size: number
        type: "file" | "directory" | "symlink"
    }> {
        const uri = this.toProjectFileUri(name)
        try {
            const stat = await vscode.workspace.fs.stat(uri)
            if (!stat) return undefined
            return {
                size: stat.size,
                type:
                    stat.type === vscode.FileType.File
                        ? "file"
                        : stat.type === vscode.FileType.Directory
                          ? "directory"
                          : stat.type == vscode.FileType.SymbolicLink
                            ? "symlink"
                            : undefined,
            }
        } catch (e) {
            return undefined
        }
    }
    async readFile(name: string): Promise<Uint8Array> {
        const uri = this.toProjectFileUri(name)
        const buffer = await vscode.workspace.fs.readFile(uri)
        return new Uint8Array(buffer)
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.writeFile(uri, content)
    }
    private toProjectFileUri(name: string) {
        const wksrx = /^workspace:\/\//i
        const uri = wksrx.test(name)
            ? Utils.joinPath(
                  vscode.workspace.workspaceFolders[0].uri,
                  name.replace(wksrx, "")
              )
            : /^(\/|\w:\\)/i.test(name) ||
                name.startsWith(vscode.workspace.workspaceFolders[0].uri.fsPath)
              ? Uri.file(name)
              : Utils.joinPath(vscode.workspace.workspaceFolders[0].uri, name)
        return uri
    }

    async deleteFile(name: string): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.delete(uri)
    }
    async findFiles(
        pattern: ElementOrArray<string>,
        options?: {
            ignore?: ElementOrArray<string>
            applyGitIgnore?: boolean
        }
    ): Promise<string[]> {
        const { applyGitIgnore } = options || {} // always applied?
        pattern = arrayify(pattern)
        const ignore = arrayify(options?.ignore)

        const uris = new Set<string>()
        for (const pat of pattern) {
            const res = await vscode.workspace.findFiles(pat)
            res.map((u) => vscode.workspace.asRelativePath(u, false)).forEach(
                (u) => uris.add(u)
            )
        }
        for (const pat of ignore) {
            const res = await vscode.workspace.findFiles(pat)
            res.map((u) => vscode.workspace.asRelativePath(u, false)).forEach(
                (u) => uris.delete(u)
            )
        }

        let files = Array.from(uris.values())
        if (applyGitIgnore !== false) {
            files = await filterGitIgnore(files)
        }
        return uniq(files)
    }
    async createDirectory(name: string): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.createDirectory(uri)
    }
    async deleteDirectory(name: string): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.delete(uri, { recursive: true })
    }

    async getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & CancellationOptions & TraceOptions
    ): Promise<LanguageModelConfiguration> {
        const client = await this.server.client()
        const tok = await client.getLanguageModelConfiguration(modelId, options)
        return tok
    }
}
