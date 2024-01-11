import { exec } from "./exec"
import { Host } from "./host"
import { MarkdownTrace } from "./trace"

export async function clip(
    host: Host,
    trace: MarkdownTrace,
    urlOrFile: string,
    outputFile: string,
    format?: "markdown" | "json"
) {
    const command = "npx"
    const args = [
        "--yes",
        "@philschmid/clipper",
        "clip",
        "-f",
        format || "markdown",
        /^http?s:/i.test(urlOrFile) ? "-u" : "-i",
        urlOrFile,
        "-o",
        outputFile,
    ]
    const res = await exec(host, trace, {
        label: "clipper",
        call: {
            type: "shell",
            command,
            args,
            outputFile,
        },
    })
    return res
}
