script({ title: "git-history", tests: {} })

const author = env.vars.author || "pelikhan"
const until = env.vars.until || "2023-11-15"

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
