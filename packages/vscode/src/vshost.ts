import * as vscode from "vscode"
import { createVSPath } from "./vspath"
import { TerminalServerManager } from "./servermanager"
import { AzureManager } from "./azuremanager"
import { Uri } from "vscode"
import { ExtensionState } from "./state"
import { Utils } from "vscode-uri"
import { checkFileExists, readFileText } from "./fs"
import { filterGitIgnore } from "../../core/src/gitignore"
import {
    parseDefaultsFromEnv,
    parseTokenFromEnv,
} from "../../core/src/connection"
import {
    DEFAULT_EMBEDDINGS_MODEL,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    DOT_ENV_FILENAME,
    MODEL_PROVIDER_AZURE,
} from "../../core/src/constants"
import { dotEnvTryParse } from "../../core/src/dotenv"
import {
    ParseService,
    setHost,
    LanguageModelConfiguration,
    LogLevel,
    Host,
} from "../../core/src/host"
import { TraceOptions, AbortSignalOptions } from "../../core/src/trace"
import { arrayify, unique } from "../../core/src/util"

export class VSCodeHost extends EventTarget implements Host {
    dotEnvPath: string = DOT_ENV_FILENAME
    userState: any = {}
    readonly path = createVSPath()
    readonly server: TerminalServerManager
    readonly parser: ParseService
    private _azure: AzureManager
    readonly defaultModelOptions = {
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
    }
    readonly defaultEmbeddingsModelOptions = {
        embeddingsModel: DEFAULT_EMBEDDINGS_MODEL,
    }

    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        this.server = new TerminalServerManager(state)
        this.parser = this.server.parser
        this.state.context.subscriptions.push(this)
    }

    async activate() {
        const dotenv = await readFileText(this.projectUri, DOT_ENV_FILENAME)
        const env = dotEnvTryParse(dotenv) ?? {}
        await parseDefaultsFromEnv(env)
    }

    get azure() {
        if (!this._azure) this._azure = new AzureManager(this.state)
        return this._azure
    }

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
        return vscode.workspace.rootPath ?? "."
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
        pattern: string | string[],
        options?: {
            ignore?: string | string[]
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
        if (applyGitIgnore && (await checkFileExists(this.projectUri, ".gitignore"))) {
            const gitignore = await readFileText(this.projectUri, ".gitignore")
            files = await filterGitIgnore(gitignore, files)
        }
        return unique(files)
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
            const dotenv = await readFileText(this.projectUri, DOT_ENV_FILENAME)
            const env = dotEnvTryParse(dotenv)
            return env?.[name]
        } catch (e) {
            return undefined
        }
    }

    async getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & AbortSignalOptions & TraceOptions
    ): Promise<LanguageModelConfiguration> {
        const { signal, token: askToken } = options || {}
        const dotenv = await readFileText(this.projectUri, DOT_ENV_FILENAME)
        const env = dotEnvTryParse(dotenv) ?? {}
        await parseDefaultsFromEnv(env)
        const tok = await parseTokenFromEnv(env, modelId)
        if (
            askToken &&
            tok &&
            !tok.token &&
            tok.provider === MODEL_PROVIDER_AZURE
        ) {
            const azureToken = await this.azure.getOpenAIToken()
            if (!azureToken) throw new Error("Azure token not available")
            tok.token = "Bearer " + azureToken
            tok.curlHeaders = {
                Authorization: "Bearer ***",
            }
        }
        return tok
    }

    // executes a process
    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions
    ): Promise<ShellOutput> {
        const res = await this.server.client.exec(
            containerId,
            command,
            args,
            options
        )
        return res.value
    }
}
