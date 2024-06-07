import {
    CHANGE,
    dotEnvTryParse,
    Host,
    LogLevel,
    LanguageModelConfiguration,
    ReadFileOptions,
    createFileSystem,
    parseTokenFromEnv,
    setHost,
    ParseService,
    createBundledParsers,
    AskUserOptions,
    TraceOptions,
    arrayify,
    resolveLanguageModel,
    LanguageModel,
    MODEL_PROVIDER_AZURE,
} from "genaiscript-core"
import { Uri } from "vscode"
import { ExtensionState } from "./state"
import { Utils } from "vscode-uri"
import { readFileText, writeFile } from "./fs"
import * as vscode from "vscode"
import { createVSPath } from "./vspath"
import { TerminalServerManager } from "./servermanager"
import { AzureManager } from "./azuremanager"

export class VSCodeHost extends EventTarget implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}
    readonly path = createVSPath()
    readonly server: TerminalServerManager
    readonly workspace = createFileSystem()
    readonly parser: ParseService
    private _azure: AzureManager

    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        const isElectron = vscode.env.uiKind === vscode.UIKind.Desktop
        this.server = new TerminalServerManager(state)
        this.parser = isElectron ? this.server.parser : createBundledParsers()
        this.state.context.subscriptions.push(this)
    }
    async container(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        const { trace, ...rest } = options || {}
        const res = await this.server.client.containerStart(rest)
        const containerId = res.id
        const hostPath = res.hostPath
        const containerPath = res.containerPath
        return {
            id: containerId,
            disablePurge: res.disablePurge,
            hostPath,
            containerPath,
            writeText: async (filename, content) => {
                const fn = vscode.workspace.asRelativePath(
                    this.path.join(hostPath, filename),
                    false
                )
                await writeFile(this.projectUri, fn, content)
            },
            readText: async (filename) => {
                const fn = vscode.workspace.asRelativePath(
                    this.path.join(hostPath, filename),
                    false
                )
                return await readFileText(this.projectUri, fn)
            },
            exec: async (command, args, options) => {
                const r = await this.server.client.exec(
                    containerId,
                    command,
                    args,
                    options
                )
                return r.value
            },
        }
    }
    async removeContainers(): Promise<void> {
        if (this.server.started) await this.server.client.containerRemove()
    }

    get azure() {
        if (!this._azure) this._azure = new AzureManager(this.state)
        return this._azure
    }

    get retrieval() {
        return this.server.retrieval
    }

    get models() {
        return this.server.models
    }

    get context() {
        return this.state.context
    }
    clearVirtualFiles(): void {
        this.virtualFiles = {}
    }
    setVirtualFile(name: string, content: string) {
        this.virtualFiles = {}
        this.virtualFiles[name] = this.createUTF8Encoder().encode(content)
    }
    isVirtualFile(name: string) {
        return !!this.virtualFiles[name]
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
        return vscode.workspace.rootPath ?? "."
    }
    installFolder(): string {
        return this.context.extensionUri.fsPath
    }
    resolvePath(...segments: string[]): string {
        if (segments.length === 0) return "."
        const s0 = segments.shift()
        let r = Uri.file(s0)
        if (segments.length) r = Uri.joinPath(r, ...segments)
        return r.fsPath
    }

    log(level: LogLevel, msg: string): void {
        const output = this.state.output
        switch (level) {
            case LogLevel.Error:
                output.error(msg)
                break
            case LogLevel.Warn:
                output.warn(msg)
                break
            case LogLevel.Verbose:
                output.debug(msg)
                break
            default:
                output.info(msg)
                break
        }
    }
    async readFile(
        name: string,
        options?: ReadFileOptions
    ): Promise<Uint8Array> {
        const uri = this.toProjectFileUri(name)
        const v = this.virtualFiles[uri.fsPath]
        if (options?.virtual) {
            if (!v) throw new Error("virtual file not found")
            return v // alway return virtual files
        } else if (options?.virtual !== false && !!v) return v // optional return virtual files

        const buffer = await vscode.workspace.fs.readFile(uri)
        return new Uint8Array(buffer)
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        const uri = this.toProjectFileUri(name)
        delete this.virtualFiles[uri.fsPath]
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
        delete this.virtualFiles[uri.fsPath]
        await vscode.workspace.fs.delete(uri)
    }
    async findFiles(
        pattern: string | string[],
        ignore?: string | string[]
    ): Promise<string[]> {
        pattern = arrayify(pattern)
        ignore = arrayify(ignore)

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
        return Array.from(uris.values())
    }
    async createDirectory(name: string): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.createDirectory(uri)
    }
    async deleteDirectory(name: string): Promise<void> {
        const uri = this.toProjectFileUri(name)
        await vscode.workspace.fs.delete(uri, { recursive: true })
    }

    async readSecret(name: string): Promise<string | undefined> {
        try {
            const dotenv = await readFileText(this.projectUri, ".env")
            const env = dotEnvTryParse(dotenv)
            return env?.[name]
        } catch (e) {
            return undefined
        }
    }

    async getLanguageModelConfiguration(
        modelId: string
    ): Promise<LanguageModelConfiguration> {
        const dotenv = await readFileText(this.projectUri, ".env")
        const env = dotEnvTryParse(dotenv) ?? {}
        const tok = await parseTokenFromEnv(env, modelId)
        return tok
    }

    async resolveLanguageModel(
        options: {
            model?: string
            languageModel?: LanguageModel
        },
        configuration: LanguageModelConfiguration
    ): Promise<LanguageModel> {
        const model = resolveLanguageModel(options, configuration)
        if (model?.id === MODEL_PROVIDER_AZURE) {
            await this.azure.signIn()
        }
        return model
    }

    async setSecretToken(tok: LanguageModelConfiguration): Promise<void> {
        this.dispatchEvent(new Event(CHANGE))
    }

    async askUser(options: AskUserOptions) {
        const res = vscode.window.showInputBox({
            ...options,
            title: `GenAIScript ask user`,
            ignoreFocusOut: true,
        })
        return res
    }

    // executes a process
    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions
    ): Promise<Partial<ShellOutput>> {
        const res = await this.server.client.exec(
            containerId,
            command,
            args,
            options
        )
        return res.value
    }
}
