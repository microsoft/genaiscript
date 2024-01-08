// this is typically an instance of TextDecoder
export interface UTF8Decoder {
    decode(
        input: Uint8Array,
        options?: {
            stream?: boolean | undefined
        }
    ): string
}

export interface UTF8Encoder {
    encode(input: string): Uint8Array
}

export enum LogLevel {
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

export interface OAIToken {
    url: string
    token: string
    isOpenAI?: boolean
    isTGI?: boolean
    source?: string
}

export interface ReadFileOptions {
    virtual?: boolean
}

export interface ShellOutput {
    stdout: string
    stderr: string
    exitCode: number
    failed: boolean
}

export interface Host {
    userState: any

    createUTF8Decoder(): UTF8Decoder
    createUTF8Encoder(): UTF8Encoder
    projectFolder(): string
    resolvePath(...segments: string[]): string

    getSecretToken(): Promise<OAIToken | undefined>
    setSecretToken(tok: OAIToken): Promise<void>
    askToken(): Promise<string>

    log(level: LogLevel, msg: string): void

    // fs
    readFile(name: string, options?: ReadFileOptions): Promise<Uint8Array>
    writeFile(name: string, content: Uint8Array): Promise<void>
    findFiles(glob: string): Promise<string[]>
    setVirtualFile(name: string, content: string): void
    isVirtualFile(name: string): boolean

    // This has mkdirp-semantics (parent directories are created and existing ignored)
    createDirectory(name: string): Promise<void>

    // executes a process
    exec(
        command: string,
        args: string[],
        stdin: string,
        options: {
            cwd?: string
            timeout?: number
        }
    ): Promise<ShellOutput>
}

export let host: Host

export function setHost(h: Host) {
    host = h
}

export const coarchFolder = ".gptools"
export const coarchExt = ".gptools.jsonl"
