import { fileTypeFromBuffer } from "file-type"
import { PassThrough } from "stream"
import { logVerbose } from "./util"
import { writeFile } from "fs/promises"
import { Readable } from "stream"

async function importFfmpeg() {
    const ffmpeg = await import("fluent-ffmpeg")
    return ffmpeg.default
}

export async function convertToAudioBlob(data: Buffer): Promise<Blob> {
    const mime = await fileTypeFromBuffer(data)
    if (/^audio\//.test(mime?.mime))
        return new Blob([data], { type: mime.mime })

    logVerbose(`ffmpeg: extracting audio from video...`)
    return new Promise<Blob>(async (resolve, reject) => {
        const inputStream = new PassThrough()
        inputStream.end(data)
        await writeFile("input.mp4", data)

        console.log(await fileTypeFromBuffer(data))
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on("data", (chunk) => chunks.push(chunk))
        outputStream.on("end", async () => {
            const buffer = Buffer.concat(chunks)
            const mime = await fileTypeFromBuffer(buffer)
            await writeFile("audio.wav", buffer)
            resolve(new Blob([buffer], { type: mime.mime }))
        })
        outputStream.on("error", reject)

        const ffmpeg = await importFfmpeg()
        ffmpeg(inputStream)
            .toFormat("wav")
            .audioBitrate("16k")
            .on("error", reject)
            .pipe(outputStream)
    })
}
