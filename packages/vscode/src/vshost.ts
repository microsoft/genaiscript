import { Host, LogLevel, OAIToken, defaultLog, setHost } from "coarch-core"
import { Uri, window, workspace } from "vscode"
import { CHANGE, ExtensionState } from "./state"

const OPENAI_TOKEN_KEY = "coarch.openAIToken"

export class VSCodeHost extends EventTarget implements Host {
    userState: any = {}

    constructor(readonly state: ExtensionState) {
        super()
        setHost(this)
        this.state.context.subscriptions.push(this)
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
    async askToken(): Promise<string> {
        const t = await window.showInputBox({
            placeHolder: "Copy OpenAI token",
            prompt: "CoArch - Please enter your OpenAI token (sk-...). It will be stored in the workspace secrets.",
        })
        return t
    }
    log(level: LogLevel, msg: string): void {
        defaultLog(level, msg)
    }
    async readFile(name: string): Promise<Uint8Array> {
        return await workspace.fs.readFile(Uri.file(name))
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await workspace.fs.writeFile(Uri.file(name), content)
    }
    async createDirectory(name: string): Promise<void> {
        await workspace.fs.createDirectory(Uri.file(name))
    }
    async getSecretToken(): Promise<OAIToken> {
        const s = await this.context.secrets.get(OPENAI_TOKEN_KEY)
        if (!s) return undefined
        return JSON.parse(s)
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
}
