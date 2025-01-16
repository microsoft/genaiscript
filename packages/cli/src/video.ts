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
    }
) {
    const { ...rest } = options || {}
    if (!rest.count && !rest.timestamps?.length) rest.count = 3
    const ffmpeg = new FFmepgClient()
    const frames = await ffmpeg.extractFrames(file, {
        ...rest,
    })
    for (let i = 0; i < frames.length; i++) {
        const fn = frames[i]
        console.log(`  ${fn}`)
    }
}
