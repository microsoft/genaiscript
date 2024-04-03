script({
    title: "summarize all files using import"
})

export default function () {
    def("FILE", env.files)
    $`Summarize each file. Be concise.`
}