import { fileTypeFromBuffer } from "file-type"
import { PassThrough, pipeline } from "stream"
import { dotGenaiscriptPath, logError, logVerbose } from "./util"
import { MarkdownTrace, TraceOptions } from "./trace"
import { lookupMime } from "./mime"
import { host } from "./host"
import pLimit from "p-limit"
import { randomHex } from "./crypto"
import { join } from "path"
import { ensureDir } from "fs-extra"

async function ffmpeg(options?: TraceOptions) {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd({ logger: console })
        .on("start", (commandLine) => {
            logVerbose(commandLine)
        })
        .on("progress", () => {
            process.stderr.write(".")
        })
        .on("stderr", (s) => {
            logVerbose(s)
        })
}

export async function convertToAudioBlob(
    file: string,
    options: { forceConversion?: boolean } & TraceOptions
): Promise<Blob> {
    const { forceConversion } = options
    if (!forceConversion) {
        const mime = lookupMime(file)
        if (/^audio/.test(mime)) {
            const buffer = await host.readFile(file)
            return new Blob([buffer], { type: mime })
        }
    }

    logVerbose(`ffmpeg: extracting audio from video...`)
    // ffmpeg -i helloworld.mp4 -q:a 0 -map a output.mp3
    return new Promise<Blob>(async (resolve, reject) => {
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []
        outputStream.on("data", (chunk) => chunks.push(chunk))
        outputStream.on("end", async () => {
            const buffer = Buffer.concat(chunks)
            if (!buffer.length) reject(new Error("conversion failed"))
            const mime = await fileTypeFromBuffer(buffer)
            resolve(new Blob([buffer], { type: mime.mime }))
        })
        outputStream.on("error", (e) => {
            logError(e)
            reject(e)
        })
        const cmd = await ffmpeg(options)
        cmd.input(file)
            .noVideo()
            .input(file)
            .toFormat("wav")
            .pipe(outputStream, { end: true })
    })
}

export async function extractAllFrames(
    videoPath: string,
    options: {
        timestamps?: number[]
        filename?: string
        count?: number
        size?: string
        folder?: string
    } & TraceOptions
): Promise<string[]> {
    if (!options.count && !options.timestamps) options.count = 3
    if (!options.filename) options.filename = "%b_%i.png"
    if (!options.folder)
        options.folder = dotGenaiscriptPath("frames", randomHex(7))
    await ensureDir(options.folder)
    return new Promise(async (resolve, reject) => {
        let filenames: string[]
        const cmd = await ffmpeg(options)
        cmd.input(videoPath)
            .screenshots(options)
            .on("error", (err: Error) => {
                logError(err)
                reject(err)
            })
            .on("filenames", (fns: string[]) => {
                filenames = fns.map((fn) => join(options.folder, fn))
            })
            .on("end", () => {
                resolve(filenames)
            })
    })
}
