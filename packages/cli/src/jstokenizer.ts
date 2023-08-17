import * as ts from "typescript"

const SK = ts.SyntaxKind
const scanner = ts.createScanner(
    ts.ScriptTarget.ESNext,
    false,
    ts.LanguageVariant.Standard
)

export interface Task {
    startPos: number
    endPos: number
    text: string
    children: Task[]
}

export function dumpTask(t: Task) {
    let r = ""
    dumpCh("", t)
    return r

    function dumpCh(path: string, t: Task) {
        if (t.text) r += `${path}: ${JSON.stringify(t.text)}\n`
        for (let i = 0; i < t.children.length; ++i) {
            dumpCh("  " + path + (path ? "." : "") + (i + 1), t.children[i])
        }
    }
}

export function tokenize(text: string) {
    scanner.setText(text)

    const rootTask: Task = {
        startPos: 0,
        endPos: text.length,
        text: "",
        children: collect(true),
    }

    console.log(dumpTask(rootTask))

    return rootTask

    function collect(top = false): Task[] {
        const res: Task[] = []

        for (;;) {
            const t = scanner.scan()

            const last = res[res.length - 1]
            const pos = scanner.getTokenPos()

            if (t == SK.EndOfFileToken || (!top && t == SK.CloseBraceToken)) {
                if (last) last.endPos = pos
                break
            }

            if (t == SK.OpenBraceToken) {
                const ch = collect()
                if (last) {
                    last.children.push(...ch)
                } else {
                    res.push(...ch)
                }
            }

            const text = scanner.getTokenText()
            if (t == SK.MultiLineCommentTrivia && text.startsWith("/*>")) {
                if (last) last.endPos = pos
                res.push({
                    startPos: pos,
                    endPos: -1,
                    text,
                    children: [],
                })
            }
        }

        return res
    }
}
