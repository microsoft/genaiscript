import { markdownifyPdf } from "genaiscript/runtime"
script({
    files: "src/pdf/jacdac.pdf",
})

const res = await markdownifyPdf(env.files[0])
for (const md of res.markdowns) env.output.appendContent(md)
