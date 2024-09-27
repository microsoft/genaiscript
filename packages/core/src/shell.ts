import { parse, quote } from "shell-quote"

export function shellParse(cmd: string): string[] {
    const args = parse(cmd)
    const res = args
        .filter((e) => !(e as any).comment)
        .map((e) =>
            typeof e === "string"
                ? e
                : (e as any).op === "glob"
                  ? (e as any).pattern
                  : (e as any).op
        )
    return res
}

export function shellQuote(args: string[]): string {
    return quote(args)
}

export function shellRemoveAsciiColors(text: string) {
    return text?.replace(/\x1b\[[0-9;]*m/g, "") // ascii colors
}
