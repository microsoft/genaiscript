import { fileTypeFromBuffer } from "file-type"
import { PassThrough } from "stream"
import { dotGenaiscriptPath, logError, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { lookupMime } from "./mime"
import { host } from "./host"
import pLimit from "p-limit"
import { join, extname } from "node:path"
import { ensureDir } from "fs-extra"
import type { FfmpegCommand } from "fluent-ffmpeg"
import { hash } from "./crypto"
import { VIDEO_HASH_LENGTH } from "./constants"
import { writeFile, readFile } from "fs/promises"
import { errorMessage, serializeError } from "./error"

const ffmpegLimit = pLimit(1)

async function ffmpeg(options?: TraceOptions) {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd({ logger: console, timeout: 1000000 })
}

export async function runFfmpeg<T>(
    renderer: (cmd: FfmpegCommand) => Awaitable<T>,
    options?: TraceOptions & { folder?: string }
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
                await writeFile(logFilename, log.join("\n"), {
                    encoding: "utf-8",
                })
                logVerbose(`ffmpeg log: ${logFilename}`)
            }

            cmd.on("stderr", (s) => log.push(s))
            cmd.on("end", writeLog)
            cmd.on("error", async (err) => {
                log.push(`error: ${errorMessage(err)}\n${serializeError(err)}`)
                await writeLog()
            })
        }

        const res = await renderer(cmd)
        if (resFilename)
            await writeFile(resFilename, JSON.stringify(res, null, 2))
        return res
    })
}

export async function segmentVideo(
    filename: string,
    segmentTime: number,
    options?: TraceOptions
): Promise<string[]> {
    const h = await hash([{ filename }, { segmentTime }], {
        readWorkspaceFiles: true,
        version: true,
        length: VIDEO_HASH_LENGTH,
    })
    const outputFolder = dotGenaiscriptPath("video", "segments", h)
    const ext = extname(filename)
    await ensureDir(outputFolder)
    return runFfmpeg(
        async (cmd) =>
            new Promise((resolve, reject) => {
                const segments: string[] = []
                cmd.input(filename)
                    .outputOptions([
                        `-f segment`,
                        `-segment_time ${segmentTime}`,
                        `-reset_timestamps 1`,
                        `${outputFolder}/output%03d.${ext}`,
                    ])
                    .on("error", (err: Error) => {
                        logError(err)
                        reject(err)
                    })
                    .on("end", () => {
                        resolve(segments)
                    })
                    .on("filenames", (fns: string[]) => {
                        segments.push(
                            ...fns.map((fn) => join(outputFolder, fn))
                        )
                    })
                    .run()
            })
    )
}

export async function videoExtractAudio(
    filename: string,
    options: { forceConversion?: boolean } & TraceOptions
): Promise<Buffer> {
    const { trace, forceConversion } = options
    if (!forceConversion) {
        const mime = lookupMime(filename)
        if (/^audio/.test(mime)) {
            const buffer = await host.readFile(filename)
            return Buffer.from(buffer)
        }
    }

    // ffmpeg -i helloworld.mp4 -q:a 0 -map a output.mp3
    return runFfmpeg(
        async (cmd) =>
            new Promise<Buffer>(async (resolve, reject) => {
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
                cmd.input(filename)
                    .noVideo()
                    .input(filename)
                    .toFormat("wav")
                    .pipe(outputStream)
            }),
        { trace }
    )
}

export async function videoExtractFrames(
    filename: string,
    options: {
        timestamps?: number[]
        filename?: string
        count?: number
        size?: string
        folder?: string
    } & TraceOptions
): Promise<string[]> {
    if (!options.count && !options.timestamps) options.count = 3
    if (!options.filename) options.filename = "%b_%i.png"
    if (!options.folder) {
        const { trace, ...rest } = options
        const h = await hash([{ filename }, rest], {
            readWorkspaceFiles: true,
            version: true,
            length: VIDEO_HASH_LENGTH,
        })
        options.folder = dotGenaiscriptPath("video", "frames", h)
    }

    return runFfmpeg(
        async (cmd) =>
            new Promise(async (resolve, reject) => {
                let filenames: string[]
                cmd.input(filename)
                    .screenshots(options)
                    .on("error", (err: Error) => {
                        logError(err)
                        reject(err)
                    })
                    .on(
                        "filenames",
                        (fns: string[]) =>
                            (filenames = fns.map((fn) =>
                                join(options.folder, fn)
                            ))
                    )
                    .on("end", async () => resolve(filenames))
            }),
        options
    )
}
