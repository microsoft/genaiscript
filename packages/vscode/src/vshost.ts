import {
    CHANGE,
    Host,
    LogLevel,
    OAIToken,
    ReadFileOptions,
    ShellCallOptions,
    ShellOutput,
    logVerbose,
    parseTokenFromEnv,
    setHost,
} from "gptools-core"
import { Uri, window, workspace } from "vscode"
import { ExtensionState, TOKEN_DOCUMENTATION_URL } from "./state"
import { Utils } from "vscode-uri"
import { parse } from "dotenv"
import { checkFileExists, readFileText, writeFile } from "./fs"
import * as vscode from "vscode"

const OPENAI_TOKEN_KEY = "coarch.openAIToken"

export class VSCodeHost extends EventTarget implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}

    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        this.state.context.subscriptions.push(this)
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
    resolvePath(...segments: string[]): string {
        if (segments.length === 0) return "."
        const s0 = segments.shift()
        let r = Uri.file(s0)
        if (segments.length) r = Uri.joinPath(r, ...segments)
        return r.fsPath
    }

    private lastToken: string
    async askToken(): Promise<string> {
        const pick = await window.showQuickPick(
            [
                {
                    id: "workspace",
                    label: "Use workspace secrets",
                    description:
                        "Use the OpenAI token stored in the workspace secrets",
                },
                {
                    id: "env",
                    label: "Use .env",
                    description: "Store OpenAI configuration in a .env file",
                },
            ],
            {
                title: "GPTools - OpenAI token configuration",
            }
        )

        if (pick === undefined) return undefined

        if (pick.id === "workspace") {
            let t = await window.showInputBox({
                placeHolder: "Paste OpenAI token",
                title: "GPTools - OpenAI token configuration",
                prompt: `Please enter your OpenAI token or Azure AI key. It will be stored in the workspace secrets. [Learn more...](${TOKEN_DOCUMENTATION_URL})`,
                value: this.lastToken,
            })
            this.lastToken = t

            // looks like a token, missing endpoint
            if (/^[a-z0-9]{32,}$/i.test(t) && !/sk-/.test(t)) {
                const endpoint = await window.showInputBox({
                    placeHolder: "Paste deployment endpoint",
                    prompt: "The token looks like an Azure AI service token. Please paste de Azure AI endpoint or leave empty to ignore.",
                })
                if (endpoint && /^https:\/\//.test(endpoint)) {
                    t = `${endpoint}#key=${t}`
                    this.lastToken = undefined
                } else t = undefined // don't know how to handle this token
            }

            return t
        } else {
            const uri = Uri.joinPath(this.projectUri, ".env")
            if (!(await checkFileExists(uri)))
                await writeFile(
                    this.projectUri,
                    ".env",
                    `#/-------------------OpenAI configuration---------------------/
OPENAI_API_KEY="<your token>"
OPENAI_API_BASE="https://api.openai.com/v1/"
# OPENAI_API_TYPE="azure"
`
                )

            const doc = await workspace.openTextDocument(uri)
            await window.showTextDocument(doc)
            const text = doc.getText()
            let nextText = text
            if (!/OPENAI_API_KEY/.test(text))
                nextText += `\nOPENAI_API_KEY="<your token>"`
            if (!/OPENAI_API_BASE/.test(text))
                nextText += `\nOPENAI_API_BASE="https://api.openai.com/v1"`
            if (!/OPENAI_API_TYPE/.test(text))
                nextText += `\n# OPENAI_API_TYPE="azure"`
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
            : Uri.file(name)

        const v = this.virtualFiles[uri.fsPath]
        if (options?.virtual) {
            if (!v) throw new Error("virtual file not found")
            return v // alway return virtual files
        } else if (options?.virtual !== false && !!v) return v // optional return virtual files

        return await workspace.fs.readFile(uri)
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
    async getSecretToken(): Promise<OAIToken> {
        const s = await this.context.secrets.get(OPENAI_TOKEN_KEY)
        if (s) {
            const res = JSON.parse(s)
            res.source = "workspace secrets"
            return res
        }

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
        if (!tok || !tok.token)
            await this.context.secrets.delete(OPENAI_TOKEN_KEY)
        else
            await this.context.secrets.store(
                OPENAI_TOKEN_KEY,
                JSON.stringify(tok)
            )
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
            name: "GPTools",
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
