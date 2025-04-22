script({
    title: "Linters",
    systemSafety: false,
    system: ["system", "system.assistant", "system.annotations"],
    responseType: "text",
    parameters: {
        base: {
            type: "string",
            description: "The base commit to compare against.",
            default: "HEAD^",
        },
    },
})
const { vars, dbg, output } = env

const linters = await workspace.findFiles(".github/linters/*.md")
if (!linters) cancel("no linters found in .github/linters/*.md")
dbg(`found %d linters`, linters.length)

const base: string = vars.base || (await git.defaultBranch())
const diff = await git.diff({
    base,
    llmify: true,
    ignoreSpaceChange: true,
})
if (!diff) cancel("nothing changed")

def("DIFF", diff, { language: "diff", maxTokens: 4000 })

$`You are an expert in code linting. 

You will be provided a list of linters and you will apply them
to the code in the <DIFF> variable using the strategy below.

## Strategy

for each linter:
   read the linter description
   apply the linter to the code in <DIFF>
   report any errors or warnings using annotations format. Use the linter name as the code.

## Linters

`.role("system")
for (const linter of linters) {
    const name = path.basename(linter.filename)
    const content = MD.content(linter)

    $`### ${name}`.role("system")
    writeText(content, { role: "system" })
}
