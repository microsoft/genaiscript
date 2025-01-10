import { videoExtractAudio, videoExtractFrames } from "../../core/src/ffmpeg"

export async function extractAudio(file: string, options: { force: boolean }) {
    const { force } = options || {}
    const fn = await videoExtractAudio(file, { forceConversion: force })
    console.log(`transcoded file to ${fn}`)
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
    const frames = await videoExtractFrames(file, {
        folder: out,
        ...rest,
    })
    for (let i = 0; i < frames.length; i++) {
        const fn = frames[i]
        console.log(`  ${fn}`)
    }
}
