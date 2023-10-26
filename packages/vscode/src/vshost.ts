import {
    CHANGE,
    Host,
    LogLevel,
    OAIToken,
    defaultLog,
    setHost,
} from "coarch-core"
import { Uri, window, workspace } from "vscode"
import { ExtensionState, TOKEN_DOCUMENTATION_URL } from "./state"

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

    private lastToken: string
    async askToken(): Promise<string> {
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
    }
    log(level: LogLevel, msg: string): void {
        // add prefix for easier filtering in console
        defaultLog(level, "gptools> " + msg)
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
