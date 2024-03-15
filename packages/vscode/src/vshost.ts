import {
    CHANGE,
    Host,
    LogLevel,
    OAIToken,
    ReadFileOptions,
    ShellCallOptions,
    ShellOutput,
    TOOL_NAME,
    createFileSystem,
    logVerbose,
    parseTokenFromEnv,
    setHost,
} from "genaiscript-core"
import { Uri, window, workspace } from "vscode"
import { ExtensionState } from "./state"
import { Utils } from "vscode-uri"
import { parse } from "dotenv"
import { checkFileExists, readFileText, writeFile } from "./fs"
import * as vscode from "vscode"
import { createVSPath } from "./vspath"
import { TerminalServerManager } from "./servermanager"

export class VSCodeHost extends EventTarget implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}
    readonly evalUseFile: false
    readonly path = createVSPath()
    readonly server: TerminalServerManager
    readonly fs = createFileSystem()

    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        this.server = new TerminalServerManager(state)
        this.state.context.subscriptions.push(this)
    }

    get retreival() {
        return this.server.retreival
    }

    get highlight() {
        return this.server.highlight
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
        return workspace.workspaceFolders[0]?.uri
    }
    projectFolder(): string {
        return workspace.rootPath ?? "."
    }
    installFolder(): string {
        return Utils.joinPath(this.context.extensionUri, "built").fsPath
    }
    resolvePath(...segments: string[]): string {
        if (segments.length === 0) return "."
        const s0 = segments.shift()
        let r = Uri.file(s0)
        if (segments.length) r = Uri.joinPath(r, ...segments)
        return r.fsPath
    }

    public async setupDotEnv(): Promise<string> {
        // update .gitignore file
        if (!(await checkFileExists(this.projectUri, ".gitignore")))
            await writeFile(this.projectUri, ".gitignore", ".env\n")
        else {
            const content = await readFileText(this.projectUri, ".gitignore")
            if (!content.includes(".env"))
                await writeFile(
                    this.projectUri,
                    ".gitignore",
                    content + "\n.env\n"
                )
        }

        // update .env
        const uri = Uri.joinPath(this.projectUri, ".env")
        if (!(await checkFileExists(uri)))
            await writeFile(
                this.projectUri,
                ".env",
                `OPENAI_API_KEY="<your token>"
`
            )

        const doc = await workspace.openTextDocument(uri)
        await window.showTextDocument(doc)
        const text = doc.getText()
        let nextText = text
        if (!/OPENAI_API_KEY/.test(text))
            nextText += `\nOPENAI_API_KEY="<your token>"`
        if (nextText !== text) {
            const edit = new vscode.WorkspaceEdit()
            edit.replace(
                uri,
                doc.validateRange(new vscode.Range(0, 0, 999, 999)),
                nextText
            )
            await workspace.applyEdit(edit)
        }
        return undefined
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
        const wksrx = /^workspace:\/\//i
        const uri = wksrx.test(name)
            ? Utils.joinPath(
                  workspace.workspaceFolders[0].uri,
                  name.replace(wksrx, "")
              )
            : /^(\/|\w:\\)/i.test(name) ||
                name.startsWith(workspace.workspaceFolders[0].uri.fsPath)
              ? Uri.file(name)
              : Utils.joinPath(workspace.workspaceFolders[0].uri, name)

        const v = this.virtualFiles[uri.fsPath]
        if (options?.virtual) {
            if (!v) throw new Error("virtual file not found")
            return v // alway return virtual files
        } else if (options?.virtual !== false && !!v) return v // optional return virtual files

        const buffer = await workspace.fs.readFile(uri)
        return new Uint8Array(buffer)
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        const uri = Uri.file(name)
        delete this.virtualFiles[uri.fsPath]
        await workspace.fs.writeFile(uri, content)
    }
    async deleteFile(name: string): Promise<void> {
        const uri = Uri.file(name)
        delete this.virtualFiles[uri.fsPath]
        await workspace.fs.delete(uri)
    }
    async findFiles(path: string): Promise<string[]> {
        const uris = await workspace.findFiles(path)
        return uris.map((u) => u.fsPath)
    }
    async createDirectory(name: string): Promise<void> {
        await workspace.fs.createDirectory(Uri.file(name))
    }
    async deleteDirectory(name: string): Promise<void> {
        await workspace.fs.delete(Uri.file(name), { recursive: true })
    }

    async readSecret(name: string): Promise<string | undefined> {
        try {
            const dotenv = await readFileText(this.projectUri, ".env")
            const env = parse(dotenv)
            return env?.[name]
        } catch (e) {
            return undefined
        }
    }

    async getSecretToken(): Promise<OAIToken> {
        try {
            const dotenv = await readFileText(this.projectUri, ".env")
            const env = parse(dotenv)
            const tok = await parseTokenFromEnv(env)
            tok.source = ".env file"
            return tok
        } catch (e) {
            logVerbose(e)
        }

        return undefined
    }
    async setSecretToken(tok: OAIToken): Promise<void> {
        this.dispatchEvent(new Event(CHANGE))
    }

    // executes a process
    async exec(
        command: string,
        args: string[],
        options: ShellCallOptions
    ): Promise<Partial<ShellOutput>> {
        const { cwd, exitcodefile, stdoutfile, stdinfile, outputdir } = options

        const terminal = vscode.window.createTerminal({
            cwd,
            isTransient: true,
            name: TOOL_NAME,
        })
        let watcher: vscode.FileSystemWatcher
        this.state.context.subscriptions.push(terminal)

        const clean = async () => {
            watcher?.dispose()
            terminal?.dispose()
            const i = this.state.context.subscriptions.indexOf(terminal)
            if (i > -1) this.state.context.subscriptions.splice(i, 1)
        }

        return new Promise<Partial<ShellOutput>>(async (resolve, reject) => {
            watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(outputdir, "*.txt"),
                true,
                false,
                true
            )
            watcher.onDidChange(async (e) => {
                if (await checkFileExists(Uri.file(exitcodefile))) {
                    resolve(<Partial<ShellOutput>>{})
                    watcher.dispose()
                }
            })
            const text = `${command} ${args
                .map((a) => (/\s/.test(a) ? `"${a}"` : a))
                .join(" ")} > "${stdoutfile}" 2>&1 < "${stdinfile}"`
            this.state.output.info(`${options.cwd || ""}> ` + text)
            terminal.sendText(text)
            terminal.sendText(`echo $? > "${exitcodefile}"`)
            terminal.sendText("exit 0") // vscode gives an annoying error message
        }).finally(async () => {
            await clean()
        })
    }
}
