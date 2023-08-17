import { TextFile, Fragment } from "./ast"
import { Edits } from "./edits"
import { randomRange } from "./util"

function assignFreshId(t: Fragment) {
    const prj = t.file.project
    let tries = 0

    for (;;) {
        let id = randomLetter() + randomLetter()
        // increase the number of numbers when we can't find anything for a while
        const numNums = 2 + (tries >> 7)
        for (let i = 0; i < numNums; ++i) id += randomNumber()
        if (!prj.fragmentById[id]) {
            t.id = id
            prj.fragmentById[id] = [t]
            return
        }
        tries++
    }

    function randomRng(a: string, z: string) {
        return String.fromCharCode(
            randomRange(a.charCodeAt(0), z.charCodeAt(0))
        )
    }

    function randomLetter() {
        return randomRng("A", "Z")
    }
    function randomNumber() {
        return randomRng("0", "9")
    }
}

export function assignIds(file: TextFile): Edits[] {
    if (!file.hasMissingIds) return []
    const edits: Edits[] = []
    file.forEachFragment((t) => {
        if (t.id) return
        assignFreshId(t)
        const m = /(.*?)(\{#\w+\})/.exec(t.text)
        const [l, c] = t.startPos
        if (m) {
            edits.push({
                type: "replace",
                filename: file.filename,
                label: `replace ID with ${t.id}`,
                range: [
                    [l, c + m[1].length],
                    [l, c + m[0].length],
                ],
                text: ` {#${t.id}}`,
            })
        } else {
            edits.push({
                type: "insert",
                filename: file.filename,
                label: `insert ID ${t.id}`,
                pos: [l, c + t.text.replace(/\s*\n[^]*/, "").length],
                text: ` {#${t.id}}`,
            })
        }
    })
    return edits
}
