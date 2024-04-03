script({
    title: "summarize all files using import"
})

export function main() {
    def("FILE", env.files)
    $`Summarize each file. Be concise.`
}