import { Host, ShellOutput } from "./host"
import { MarkdownTrace } from "./trace"
import { dotGenaiscriptPath, fileExists, readText, writeText } from "./util"

export async function exec(
    host: Host,
    trace: MarkdownTrace,
    options: { label: string; call: ChatFunctionCallShell }
): Promise<ShellOutput> {
    const { label, call } = options
    let { stdin, command, args, cwd, timeout, files, outputFile } = call

    let outputdir: string
    let stdinfile: string
    let stdoutfile: string
    let stderrfile: string
    let exitcodefile: string
    try {
        trace.startDetails(label)

        // configure the output folder
        outputdir = dotGenaiscriptPath(
            "temp",
            Math.random().toString(36).substring(2, 15)
        )
        await host.createDirectory(outputdir)

        stdoutfile = outputdir + "/stdout.txt"
        stderrfile = outputdir + "/stderr.txt"
        exitcodefile = outputdir + "/exitcode.txt"
        stdinfile = outputdir + "/stdin.txt"

        await writeText(stdinfile, stdin || "")

        if (files) {
            for (const f in files) {
                const content = files[f]
                const fn = outputdir + "/" + f
                await writeText(fn, content)
            }
        }

        if (outputFile) outputFile = outputdir + "/" + outputFile

        const subs = {
            outputdir,
            stdinfile,
            stdoutfile,
            stderrfile,
            exitcodefile,
        }
        const patchedArgs = args.map((a) =>
            a.replace(
                /\$\{\}/g,
                (m) =>
                    (subs as Record<string, string>)[m.toLowerCase()] || "???"
            )
        )

        if (cwd) trace.item(`cwd: ${cwd}`)
        trace.item(`shell command: \`${command}\` ${patchedArgs.join(" ")}`)
        const res = await host.exec(command, patchedArgs, {
            cwd,
            timeout,
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
        if (outputFile && (await fileExists(outputFile)))
            res.output = await readText(outputFile)

        trace.detailsFenced(`📩 output`, res.stdout || "")

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
