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
    VIDEO_FRAMES_DIR_NAME,
    VIDEO_HASH_LENGTH,
} from "./constants"
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

export async function videoExtractAudio(
    filename: string,
    options: { forceConversion?: boolean; folder?: string } & TraceOptions
): Promise<string> {
    const { trace, forceConversion } = options
    if (!forceConversion) {
        const mime = lookupMime(filename)
        if (/^audio/.test(mime)) return filename
    }
    if (!options.folder)
        await computeHashFolder(filename, VIDEO_AUDIO_DIR_NAME, options)
    const output = join(options.folder, basename(filename) + ".wav")
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

                cmd.input(filename)
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
    if (!options.folder)
        await computeHashFolder(filename, VIDEO_FRAMES_DIR_NAME, options)

    return await runFfmpeg(
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
async function computeHashFolder(
    filename: string,
    folderid: string,
    options: { folder?: string } & TraceOptions
) {
    const { trace, ...rest } = options
    const h = await hash([{ filename }, rest], {
        readWorkspaceFiles: true,
        version: true,
        length: VIDEO_HASH_LENGTH,
    })
    options.folder = dotGenaiscriptPath("video", folderid, h)
}
