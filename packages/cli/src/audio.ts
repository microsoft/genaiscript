import { fileTypeFromBuffer } from "file-type"
import { writeFile } from "node:fs/promises"
import { convertToAudioBlob, extractAllFrames } from "../../core/src/ffmpeg"

export async function extractAudio(file: string, options: { force: boolean }) {
    const { force } = options || {}
    const res = await convertToAudioBlob(file, { forceConversion: force })

    const fn = file + ".wav"
    console.log(`transcoded file to ${fn}`)
    await writeFile(fn, Buffer.from(await res.arrayBuffer()))
}

export async function extractVideoFrames(file: string, options: {}) {
    const frames = await extractAllFrames(file)
    for (let i = 0; i < frames.length; i++) {
        const fn = frames[i]
        console.log(`extracted frame to ${fn}`)
    }
}
