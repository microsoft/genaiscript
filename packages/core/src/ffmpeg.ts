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

async function ffmpeg(options?: TraceOptions) {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd({ logger: console, timeout: 1000000 })
}

async function computeHashFolder(
    filename: string | WorkspaceFile,
    folderid: string,
    options: { folder?: string } & TraceOptions
) {
    const { trace, ...rest } = options
    const h = await hash(
        [typeof filename === "string" ? { filename } : filename, rest],
        {
            readWorkspaceFiles: true,
            version: true,
            length: VIDEO_HASH_LENGTH,
        }
    )
    options.folder = dotGenaiscriptPath("video", folderid, h)
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

export async function runFfmpeg<T>(
    renderer: (cmd: FfmpegCommand) => Awaitable<T>,
    options: TraceOptions & { folder?: string }
): Promise<T> {
    const { trace, folder } = options

    return ffmpegLimit(async () => {
        const cmd = await ffmpeg({ trace })
        cmd.on("start", (commandLine) => {
            logVerbose(commandLine)
        })
        if (process.env.FFMPEG_DEBUG) cmd.on("stderr", (s) => logVerbose(s))

        const resFilename = options.folder
            ? join(options.folder, "res.json")
            : undefined
        // try cache hit
        if (resFilename) {
            try {
                const res = JSON.parse(
                    await readFile(resFilename, {
                        encoding: "utf-8",
                    })
                )
                logVerbose(`video: cache hit at ${options.folder}`)
                return res as T
            } catch {}
        }

        if (folder) {
            await ensureDir(folder)
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

        const res = await renderer(cmd)
        if (resFilename) {
            logVerbose(`ffmpeg: cache result at ${resFilename}`)
            await writeFile(resFilename, JSON.stringify(res, null, 2))
        }
        return res
    })
}

export async function videoClip(
    filename: string | WorkspaceFile,
    options: {
        start?: number | number
        duration?: number | number
        folder?: string
    } & TraceOptions
): Promise<string> {
    if (!filename) throw new Error("filename is required")

    const { start, duration } = options
    if (!options.folder)
        await computeHashFolder(filename, VIDEO_CLIPS_DIR_NAME, options)
    await ensureDir(options.folder)
    const input = await resolveInput(filename, options.folder)
    const output = join(options.folder, basename(input))
    return await runFfmpeg(
        async (cmd) =>
            new Promise<string>((resolve, reject) => {
                cmd.input(input)
                if (start) cmd.setStartTime(start)
                if (duration) cmd.setDuration(duration)
                cmd.output(output)
                cmd.on("end", () => resolve(output)).on("error", (err) =>
                    reject(err)
                )
                cmd.run()
            }),
        options
    )
}

export async function videoExtractAudio(
    filename: string | WorkspaceFile,
    options: { forceConversion?: boolean; folder?: string } & TraceOptions
): Promise<string> {
    if (!filename) throw new Error("filename is required")

    const { trace, forceConversion } = options
    if (!forceConversion && typeof filename === "string") {
        const mime = lookupMime(filename)
        if (/^audio/.test(mime)) return filename
    }
    if (!options.folder)
        await computeHashFolder(filename, VIDEO_AUDIO_DIR_NAME, options)
    await ensureDir(options.folder)
    const input = await resolveInput(filename, options.folder)
    const output = join(options.folder, basename(input) + ".wav")
    return await runFfmpeg(
        async (cmd) =>
            new Promise<string>(async (resolve, reject) => {
                /*
                const outputStream = new PassThrough()
                const chunks: Buffer[] = []
                outputStream.on("data", (chunk) => chunks.push(chunk))
                outputStream.on("end", async () => {
                    await ffmpeg(options) // keep this; it "unplugs" the output stream so that the error is not raised.
                    const buffer = Buffer.concat(chunks)
                    if (!buffer.length) reject(new Error("conversion failed"))
                    resolve(buffer)
                })
                outputStream.on("error", (e) => {
                    logError(e)
                    reject(e)
                })
                */

                cmd.input(input)
                    .noVideo()
                    .toFormat("wav")
                    .save(output)
                    .on("end", () => resolve(output))
                    .on("error", (err) => reject(err))
            }),
        options
    )
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

    const { trace, transcript, ...screenshotsOptions } = options
    if (!screenshotsOptions.filename) screenshotsOptions.filename = "%b_%i.png"
    if (transcript?.segments?.length) {
        screenshotsOptions.timestamps = transcript.segments.map((s) => s.start)
    }
    if (!screenshotsOptions.count && !screenshotsOptions.timestamps)
        screenshotsOptions.count = 5
    if (!screenshotsOptions.folder)
        await computeHashFolder(
            filename,
            VIDEO_FRAMES_DIR_NAME,
            screenshotsOptions
        )
    await ensureDir(screenshotsOptions.folder)
    const input = await resolveInput(filename, screenshotsOptions.folder)
    return await runFfmpeg(
        async (cmd) =>
            new Promise(async (resolve, reject) => {
                let filenames: string[]
                cmd.input(input)
                    .screenshots(screenshotsOptions)
                    .on("error", (err: Error) => {
                        logError(err)
                        reject(err)
                    })
                    .on(
                        "filenames",
                        (fns: string[]) =>
                            (filenames = fns.map((fn) =>
                                join(screenshotsOptions.folder, fn)
                            ))
                    )
                    .on("end", async () => resolve(filenames))
            }),
        options
    )
}

export async function videoProbe(
    filename: string | WorkspaceFile,
    options?: { folder?: string } & TraceOptions
): Promise<VideoProbeResult> {
    if (!filename) throw new Error("filename is required")

    const { trace } = options
    if (!options.folder)
        await computeHashFolder(filename, VIDEO_PROBE_DIR_NAME, options)
    await ensureDir(options.folder)
    const input = await resolveInput(filename, options.folder)
    return await runFfmpeg(
        async (cmd) =>
            new Promise<VideoProbeResult>((resolve, reject) => {
                cmd.input(input).ffprobe((err, data) => {
                    if (err) reject(err)
                    else resolve(data as any)
                })
            }),
        options
    )
}
