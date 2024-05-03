/**
 * Parse output of LLM similar to output of genaiscript def() function.
 *
 * Expect text to look something like this:
 *
 * Foo bar:
 * ```js
 * var x = 1
 * ...
 * ```
 *
 * Baz qux:
 * `````
 * Also supported.
 * ...
 * `````
 *
 * Returns a map, like this:
 *
 * {
 *   "Foo bar": "var x = 1\n...",
 *   "Baz qux": "Also supported.\n..."
 * }
 *
 * Note that outside we can treat keys like "File some/thing.js" specially.
 */
export function extractFenced(text: string): Fenced[] {
    if (!text) return []

    let currLbl = ""
    let currText = ""
    let currLanguage = ""
    let currArgs: Record<string, string> = {}
    let currFence = ""
    const vars: Fenced[] = []
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]

        if (currFence) {
            if (line.trimEnd() === currFence) {
                currFence = ""
                vars.push({
                    label: currLbl,
                    content: normalize(currLbl, currText),
                    language: currLanguage,
                    args: currArgs,
                })
                currText = ""
            } else {
                currText += line + "\n"
            }
        } else {
            const fence = startFence(line)
            if (fence.fence && fence.args["file"]) {
                currLbl = "FILE " + fence.args["file"]
                currFence = fence.fence
                currLanguage = fence.language || ""
                currArgs = fence.args
            } else {
                const start = startFence(lines[i + 1])
                const m = /(\w+):\s+([^\s]+)/.exec(line)
                if (start.fence && line.endsWith(":")) {
                    currLbl = (
                        undoublequote(line.slice(0, -1)) +
                        " " +
                        (start.args["file"] || "")
                    ).trim()
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                } else if (start.fence && m) {
                    currLbl =
                        undoublequote(m[1]) +
                        " " +
                        (start.args["file"] || undoublequote(m[2]))
                    currFence = start.fence
                    currLanguage = start.language || ""
                    currArgs = start.args
                    i++
                }
            }
        }
    }

    if (currText != "") {
        vars.push({
            label: currLbl,
            language: currLanguage,
            content: normalize(currLbl, currText),
            args: currArgs,
        })
    }

    return vars

    function normalize(label: string, text: string) {
        /** handles situtions like this:

````` file=problem1.py
```python
import re
...
 */
        if (/file=\w+\.\w+/.test(label)) {
            const m = /^\s*\`{3,}\w*\r?\n((.|\s)*)\r?\n\`{3,}\s*$/.exec(text)
            if (m) return m[1]
        }

        return text
    }
}
