script({ 
    model: "openai:gpt-3.5-turbo",
    title: "git-history", tests: {} })

const author = env.vars.author as string || "pelikhan"
const until = env.vars.until as string || "2023-11-15"

const { stdout: commits } = await host.exec("git", [
    "log",
    "--author",
    author,
    "--until",
    until,
    "--format=oneline",
])
def("COMMITS", commits.replace(/^[^ ]+ /gm, ""), { maxTokens: 20000 })

$`Summarize the git history of ${author} from ${until}.`
