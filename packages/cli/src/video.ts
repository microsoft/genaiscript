import { fileTypeFromBuffer } from "file-type"
import { writeFile } from "node:fs/promises"
import { convertToAudioBlob, extractAllFrames } from "../../core/src/ffmpeg"
import { basename, dirname } from "node:path"

export async function extractAudio(file: string, options: { force: boolean }) {
    const { force } = options || {}
    const res = await convertToAudioBlob(file, { forceConversion: force })

    const fn = file + ".wav"
    console.log(`transcoded file to ${fn}`)
    await writeFile(fn, Buffer.from(await res.arrayBuffer()))
}

export async function extractVideoFrames(
    file: string,
    options: {
        timestamps?: number[]
        count?: number
        out?: string
        size?: string
    }
) {
    const { out, ...rest } = options || {}
    if (!rest.count && !rest.timestamps?.length) rest.count = 3
    const frames = await extractAllFrames(file, {
        folder: out,
        ...rest,
    })
    for (let i = 0; i < frames.length; i++) {
        const fn = frames[i]
        console.log(`  ${fn}`)
    }
}
