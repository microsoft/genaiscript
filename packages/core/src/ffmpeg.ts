import { fileTypeFromBuffer } from "file-type"
import { PassThrough, pipeline } from "stream"
import { logError, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { lookupMime } from "./mime"
import { host } from "./host"
import pLimit from "p-limit"

async function ffmpeg() {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd()
        .on("start", (commandLine) => logVerbose(commandLine))
        .on("progress", () => process.stderr.write("."))
        .on("stderr", (s) => logVerbose(s))
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
        const cmd = await ffmpeg()
        cmd.input(file)
            .noVideo()
            .input(file)
            .toFormat("wav")
            .pipe(outputStream, { end: true })
    })
}

export async function extractAllFrames(
    videoPath: string,
    options: { timestamps?: number[]; count?: number; folder: string }
): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        const cmd = await ffmpeg()
        cmd.input(videoPath)
            .screenshots(options)
            .on("error", (err: Error) => reject(err))
            .on("filenames", (filenames: string[]) => {
                resolve(filenames)
            })
    })
}
