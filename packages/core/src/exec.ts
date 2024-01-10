import { Host, ShellOutput } from "./host"
import { MarkdownTrace } from "./trace"
import { dotGptoolsPath, fileExists, readText, writeText } from "./util"

export async function exec(
    host: Host,
    trace: MarkdownTrace,
    command: string,
    args: string[],
    options: {
        label?: string
        cwd?: string
        stdin?: string
        timeout?: number
    }
): Promise<ShellOutput> {
    const { label, stdin } = options

    let outputdir: string
    let stdinfile: string
    let stdoutfile: string
    let stderrfile: string
    let exitcodefile: string
    try {
        trace.startDetails(label)

        // configure the output folder
        outputdir = dotGptoolsPath(
            "temp",
            Math.random().toString(36).substring(2, 15)
        )
        await host.createDirectory(outputdir)

        stdoutfile = outputdir + "/stdout.txt"
        stderrfile = outputdir + "/stderr.txt"
        exitcodefile = outputdir + "/exitcode.txt"
        stdinfile = outputdir + "/stdin.txt"

        await writeText(stdinfile, stdin || "")

        const subs: Record<string, string> = {
            outputdir,
            stdinfile,
            stdoutfile,
            stderrfile,
            exitcodefile,
        }
        const patchedArgs = args.map((a) =>
            a.replace(/\$\{\}/g, (m) => subs[m.toLowerCase()] || "???")
        )

        trace.item(`shell command: \`${command}\` ${patchedArgs.join(" ")}`)
        const res = await host.exec(command, patchedArgs, stdin, {
            ...options,
            ...subs,
        })

        // read exit code from file if needed
        if (res.exitCode === undefined && (await fileExists(exitcodefile)))
            res.exitCode = parseInt(await readText(exitcodefile))

        trace.item(`exit code: ${res.exitCode}`)

        if (res.stdout === undefined && (await fileExists(stdoutfile)))
            res.stdout = await readText(stdoutfile)
        if (res.stderr === undefined && (await fileExists(stderrfile)))
            res.stderr = await readText(stderrfile)

        trace.detailsFenced(`output`, res.stdout || "")

        return <ShellOutput>res
    } finally {
        try {
            await host.deleteDirectory(outputdir)
        } finally {
            // todo delete directory
            trace.endDetails()
        }
    }
}
