import { parse, quote } from "shell-quote"

export function shellParse(cmd: string): string[] {
    const res = parse(cmd)
    return res
        .filter((e) => !(e as any).comment)
        .map((e) =>
            typeof e === "string"
                ? e
                : (e as any).op === "glob"
                  ? (e as any).pattern
                  : (e as any).op
        )
}

export function shellQuote(args: string[]): string {
    return quote(args)
}
