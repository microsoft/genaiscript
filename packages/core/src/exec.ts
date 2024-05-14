import { fileExists, readText, writeText } from "./fs"
import { Host } from "./host"
import { MarkdownTrace } from "./trace"
import { dotGenaiscriptPath } from "./util"

export interface ChatFunctionCallShell extends ShellOptions {
    command: string
    files?: Record<string, string>
    outputFile?: string
    args?: string[]
    ignoreExitCode?: boolean
}

export async function exec(
    host: Host,
    options: {
        trace?: MarkdownTrace
        label: string
        call: ChatFunctionCallShell
        keepOnError?: boolean
    }
): Promise<ShellOutput> {
    const { label, call, trace, keepOnError } = options
    let { stdin, command, args, cwd, timeout, files, outputFile } = call

    let outputdir: string
    let stdinfile: string
    let stdoutfile: string
    let stderrfile: string
    let exitcodefile: string
    try {
        trace?.startDetails(label)

        // configure the output folder
        outputdir = dotGenaiscriptPath(
            "temp",
            Math.random().toString(36).substring(2, 15)
        )
        await host.createDirectory(outputdir)

        const path = host.path
        stdoutfile = path.join(outputdir, "stdout.txt")
        stderrfile = path.join(outputdir, "stderr.txt")
        exitcodefile = path.join(outputdir, "exitcode.txt")
        stdinfile = path.join(outputdir, "stdin.txt")

        await writeText(stdinfile, stdin || "")

        if (files) {
            for (const f in files) {
                const content = files[f]
                const fn = path.join(outputdir, f)
                await writeText(fn, content)
            }
        }

        if (outputFile) outputFile = path.join(outputdir, outputFile)

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

        trace?.itemValue(`cwd`, cwd)
        trace?.itemValue(
            `shell command`,
            `\`${command}\` ${patchedArgs.join(" ")}`
        )
        const res = await host.exec(command, patchedArgs, {
            cwd,
            timeout,
            keepOnError,
            ...subs,
        })

        // read exit code from file if needed
        if (res.exitCode === undefined && (await fileExists(exitcodefile)))
            res.exitCode = parseInt(await readText(exitcodefile))

        trace?.itemValue(`exit code`, `${res.exitCode}`)

        if (res.stdout === undefined && (await fileExists(stdoutfile)))
            res.stdout = await readText(stdoutfile)
        if (res.stderr === undefined && (await fileExists(stderrfile)))
            res.stderr = await readText(stderrfile)
        if (outputFile && (await fileExists(outputFile)))
            res.output = await readText(outputFile)

        trace?.detailsFenced(`📩 output`, res.stdout || "")

        return <ShellOutput>res
    } finally {
        try {
            await host.deleteDirectory(outputdir)
        } finally {
            // todo delete directory
            trace?.endDetails()
        }
    }
}
