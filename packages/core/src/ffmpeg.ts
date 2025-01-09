import { fileTypeFromBuffer } from "file-type"
import { PassThrough } from "stream"
import { logError, logVerbose } from "./util"

async function importFfmpeg() {
    const ffmpeg = await import("fluent-ffmpeg")
    return ffmpeg.default
}

export async function convertToAudioBlob(data: Buffer): Promise<Blob> {
    {
        const mime = await fileTypeFromBuffer(data)
        if (/^audio\//.test(mime?.mime))
            return new Blob([data], { type: mime.mime })
    }

    logVerbose(`ffmpeg: extracting audio from video...`)
    return new Promise<Blob>(async (resolve, reject) => {
        const inputStream = new PassThrough()
        inputStream.end(data)

        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on("data", (chunk) => {
            chunks.push(chunk)
        })
        outputStream.on("end", async () => {
            const buffer = Buffer.concat(chunks)
            const mime = await fileTypeFromBuffer(buffer)
            console.log(mime)
            resolve(new Blob([buffer], { type: mime.mime }))
        })
        outputStream.on("error", (e) => {
            logError(e)
            reject(e)
        })

        const ffmpeg = await importFfmpeg()
        ffmpeg(inputStream, {
            logger: console,
        })
            .noVideo()
            .toFormat("wav")
            .audioBitrate("16k")
            .on("error", reject)
            .pipe(outputStream, { end: true })
    })
}
