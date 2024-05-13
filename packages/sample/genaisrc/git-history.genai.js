// metadata and model configuration
// https://microsoft.github.io/genaiscript/reference/scripts/metadata/
script({ title: "git-history" })

const author = env.vars.author || "pelikhan"
const until = env.vars.until || "2023-11-15"

const { stdout: commits } = await host.exec("git", ["log", "--author", author, "--until", until, "--format=oneline"])
def("COMMITS", commits.replace(/^[^ ]+ /gm, ''), { maxTokens: 20000 })
/*
defTool(
    "git-log",
    "Returns the list of commits for a user until a given date",
    {
        type: "object",
        properties: {
            author: { type: "string", description: "git username" },
            until: { type: "string", description: "until date formatted as yyyy-mm-dd" },
        },
        required: ["author", "until"],
    },
    (args) => {
        return {
            type: "shell",
            command: `git log --author=${args.author} --until=${args.until} --format=oneline`,
        }
    }
)
*/

$`Summarize the git history of ${author} from ${until}.`
