import { RootSchema } from "@modelcontextprotocol/sdk/types.js"

script({
    model: "echo",
    tests: {},
    group: "commit",
})
const sg = await host.astGrep()
const { matches } = await sg.search("ts", "src/*.ts", "console.log($META)")
if (matches.length < 2) throw new Error("No matches src/*.ts found")
for (const match of matches) {
    const t = match.text()
    console.log(match.getRoot().filename() + " " + match.text())
    if (!t.includes("console.log")) throw new Error("console.log found")
}

const { matches: matches2 } = await sg.search("ts", "src/fib.ts", {
    rule: {
        kind: "function_declaration",
        not: {
            precedes: {
                kind: "comment",
                stopBy: "neighbor",
            },
        },
    },
})
if (matches2.length !== 1) throw new Error("No matches found")
const cs = sg.changeset()
for (const match of matches2) {
    console.log(match.getRoot().filename() + " " + match.text())
    const fn = match.parent()
    const res = await runPrompt(
        (_) => {
            _.def("FILE", match.getRoot().root().text())
            _.def("FUNCTION", match.text())
            _.$`Generate a comment that describes the behavior of the function in <FUNCTION>.
            The full source of the file is in <FILE>.`
        },
        { model: "small", responseType: "text" }
    )
    cs.replace(match, `/**\n* ${res.text}\n**/\n${match.text()}`)
}
const modifiedFiles = cs.commit()
console.log(modifiedFiles)
//await workspace.writeFiles(files)

const { matches: cmatches } = await sg.search(
    "c",
    "src/main.c",
    YAML`
rule:
  kind: function_definition
`
)
for (const match of cmatches) {
    const t = match.text()
    console.log(t)
}

if (cmatches.length === 0) throw new Error("No matches found")
