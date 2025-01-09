import { writeFile } from "node:fs/promises"
import { convertToAudioBlob } from "../../core/src/ffmpeg"

export async function transcodeFile(file: string, options: { force: boolean }) {
    const { force } = options || {}
    const res = await convertToAudioBlob(file, { forceConversion: force })

    const fn = file + ".wav"
    console.log(`transcoded file to ${fn}`)
    await writeFile(fn, Buffer.from(await res.arrayBuffer()))
}
