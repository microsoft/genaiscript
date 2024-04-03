import { parse } from "ini"

script({
    title: "summarize all files using import"
})

export default async function () {
    const res = parse("x = 1\ny = 2")
    console.log(res)
    def("FILE", env.files)
    $`Summarize each file. Be concise.`
}