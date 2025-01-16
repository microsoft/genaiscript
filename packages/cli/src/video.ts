import { FFmepgClient } from "../../core/src/ffmpeg"

export async function extractAudio(
    file: string,
    options: { force: boolean; transcription: boolean }
) {
    const { force, transcription } = options || {}
    const ffmpeg = new FFmepgClient()
    const fn = await ffmpeg.extractAudio(file, {
        transcription,
        forceConversion: force,
    })
    console.log(fn)
}

export async function extractVideoFrames(
    file: string,
    options: {
        timestamps?: number[]
        count?: number
        size?: string
        format?: string
        keyframes?: boolean
    }
) {
    const { ...rest } = options || {}
    const ffmpeg = new FFmepgClient()
    const frames = await ffmpeg.extractFrames(file, {
        ...rest,
    })
    for (let i = 0; i < frames.length; i++) {
        const fn = frames[i]
        console.log(`${fn}`)
    }
}

export async function probeVideo(file: string) {
    const res = await ffmpeg.probe(file)
    console.log(JSON.stringify(res, null, 2))
}
