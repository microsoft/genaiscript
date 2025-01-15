import { dotGenaiscriptPath, logError, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { lookupMime } from "./mime"
import pLimit from "p-limit"
import { join, basename } from "node:path"
import { ensureDir } from "fs-extra"
import type { FfmpegCommand } from "fluent-ffmpeg"
import { hash } from "./crypto"
import {
    VIDEO_AUDIO_DIR_NAME,
    VIDEO_CLIPS_DIR_NAME,
    VIDEO_FRAMES_DIR_NAME,
    VIDEO_HASH_LENGTH,
    VIDEO_PROBE_DIR_NAME,
} from "./constants"
import { writeFile, readFile } from "fs/promises"
import { errorMessage, serializeError } from "./error"
import { fromBase64 } from "./base64"
import { fileTypeFromBuffer } from "file-type"

const ffmpegLimit = pLimit(1)

async function ffmpegCommand(options?: TraceOptions) {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd({ logger: console, timeout: 1000000 })
}

async function computeHashFolder(
    filename: string | WorkspaceFile,
    folderid: string,
    options: TraceOptions & { cache?: string }
) {
    const { trace, cache, ...rest } = options
    const h = await hash(
        [typeof filename === "string" ? { filename } : filename, rest],
        {
            readWorkspaceFiles: true,
            version: true,
            length: VIDEO_HASH_LENGTH,
        }
    )
    return dotGenaiscriptPath(cache || "ffmpeg", folderid, h)
}

async function resolveInput(
    filename: string | WorkspaceFile,
    folder: string
): Promise<string> {
    if (typeof filename === "object") {
        if (filename.content) {
            const bytes = fromBase64(filename.content)
            const mime = await fileTypeFromBuffer(bytes)
            filename = join(folder, "input." + mime.ext)
            await writeFile(filename, bytes)
        } else filename = filename.filename
    }
    return filename
}

export async function runFfmpeg(
    filename: string | WorkspaceFile,
    renderer: (
        cmd: FfmpegCommand,
        options: { input: string; folder: string; cache?: string }
    ) => Awaitable<{ output?: string; data?: any }>,
    options: TraceOptions & { cache?: string }
): Promise<{ filenames: string[]; data?: any }> {
    const { trace, cache } = options
    if (!filename) throw new Error("filename is required")
    return ffmpegLimit(async () => {
        // try cache hit
        const folder = await computeHashFolder(
            filename,
            cache || VIDEO_CLIPS_DIR_NAME,
            options
        )
        const input = await resolveInput(filename, folder)
        const resFilename = join(folder, "res.json")
        try {
            const res = JSON.parse(
                await readFile(resFilename, {
                    encoding: "utf-8",
                })
            )
            logVerbose(`video: cache hit at ${folder}`)
            return res
        } catch {}

        await ensureDir(folder)
        const cmd = await ffmpegCommand({ trace })
        // console logging
        {
            cmd.on("start", (commandLine) => logVerbose(commandLine))
            if (process.env.FFMPEG_DEBUG) cmd.on("stderr", (s) => logVerbose(s))
        }

        // setup logging
        {
            let log: string[] = []
            const writeLog = async () => {
                const logFilename = join(folder, "log.txt")
                logVerbose(`ffmpeg log: ${logFilename}`)
                await writeFile(logFilename, log.join("\n"), {
                    encoding: "utf-8",
                })
            }
            cmd.on("stderr", (s) => log.push(s))
            cmd.on("end", writeLog)
            cmd.on("error", async (err) => {
                log.push(`error: ${errorMessage(err)}\n${serializeError(err)}`)
                await writeLog()
            })
        }

        const res = await new Promise(async (resolve, reject) => {
            const r: { filenames: string[]; data?: any } = { filenames: [] }
            cmd.input(input)
            cmd.on("filenames", (fns: string[]) => {
                r.filenames.push(...fns.map((f) => join(folder, f)))
            })
            cmd.on("end", () => resolve(r))
            cmd.on("error", (err) => reject(err))
            try {
                const rendered = await renderer(cmd, { input, folder })
                if (rendered?.output) {
                    r.filenames.push(rendered?.output)
                    cmd.output(rendered?.output)
                    cmd.run()
                } else if (rendered?.data) r.data = rendered?.data
            } catch (err) {
                reject(err)
            }
        })

        logVerbose(`ffmpeg: cache result at ${resFilename}`)
        await writeFile(resFilename, JSON.stringify(res, null, 2))
        return res
    })
}

export async function videoClip(
    filename: string | WorkspaceFile,
    options: {
        start?: number | number
        duration?: number | number
    } & TraceOptions
): Promise<string> {
    const res = await runFfmpeg(
        filename,
        async (cmd, fopts) => {
            const { start, duration } = options
            const { folder, input } = fopts
            const output = join(folder, basename(input))
            if (start) cmd.setStartTime(start)
            if (duration) cmd.setDuration(duration)
            return { output }
        },
        options
    )
    return res.filenames[0]
}

export async function videoExtractAudio(
    filename: string | WorkspaceFile,
    options: { forceConversion?: boolean; folder?: string } & TraceOptions
): Promise<string> {
    if (!filename) throw new Error("filename is required")

    const { forceConversion } = options
    if (!forceConversion && typeof filename === "string") {
        const mime = lookupMime(filename)
        if (/^audio/.test(mime)) return filename
    }
    const res = await runFfmpeg(
        filename,
        async (cmd, fopts) => {
            const { input, folder } = fopts
            cmd.noVideo().toFormat("wav")
            return { output: join(folder, basename(input) + ".wav") }
        },
        { ...(options || {}), cache: VIDEO_AUDIO_DIR_NAME }
    )
    return res.filenames[0]
}

export async function videoExtractFrames(
    filename: string | WorkspaceFile,
    options: {
        timestamps?: number[] | string[]
        filename?: string
        count?: number
        size?: string
        transcript?: TranscriptionResult
        folder?: string
    } & TraceOptions
): Promise<string[]> {
    if (!filename) throw new Error("filename is required")

    const { trace, transcript, ...soptions } = options
    if (!soptions.filename) soptions.filename = "%b_%i.png"
    if (transcript?.segments?.length)
        soptions.timestamps = transcript.segments.map((s) => s.start)
    if (!soptions.count && !soptions.timestamps) soptions.count = 5
    const res = await runFfmpeg(
        filename,
        async (cmd) => {
            cmd.screenshots(soptions)
            return undefined
        },
        options
    )
    return res.filenames
}

export async function videoProbe(
    filename: string | WorkspaceFile,
    options?: { folder?: string } & TraceOptions
): Promise<VideoProbeResult> {
    if (!filename) throw new Error("filename is required")
    const { trace } = options
    const res = await runFfmpeg(
        filename,
        (cmd, fopts) =>
            new Promise<{ data?: VideoProbeResult }>((resolve, reject) => {
                cmd.ffprobe((err, data) => {
                    if (err) reject(err)
                    resolve({ data: data as any as VideoProbeResult })
                })
            }),
        options
    )
    return res.data as VideoProbeResult
}
