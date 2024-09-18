import { parse, quote } from "shell-quote"

export function shellParse(cmd: string): string[] {
    const res = parse(cmd)
    return res.filter((e) => typeof e === "string")
}

export function shellQuote(args: string[]): string {
    return quote(args)
}
