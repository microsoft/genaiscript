import { arrayify, dotGenaiscriptPath, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { lookupMime } from "./mime"
import pLimit from "p-limit"
import { join, basename } from "node:path"
import { ensureDir } from "fs-extra"
import type { FfmpegCommand } from "fluent-ffmpeg"
import { hash } from "./crypto"
import { VIDEO_HASH_LENGTH } from "./constants"
import { writeFile, readFile } from "fs/promises"
import { errorMessage, serializeError } from "./error"
import { fromBase64 } from "./base64"
import { fileTypeFromBuffer } from "file-type"
import { stat } from "node:fs/promises"
import prettyBytes from "pretty-bytes"
import { filenameOrFileToFilename } from "./unwrappers"
import { Stats } from "node:fs"
import { changeext } from "./fs"

const ffmpegLimit = pLimit(1)

async function ffmpegCommand(options?: { timeout?: number }) {
    const m = await import("fluent-ffmpeg")
    const cmd = m.default
    return cmd(options)
}

async function computeHashFolder(
    filename: string | WorkspaceFile,
    options: TraceOptions & FFmpegCommandOptions
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
    return dotGenaiscriptPath("ffmpeg", h)
}

async function resolveInput(
    filename: string | WorkspaceFile,
    folder: string
): Promise<string> {
    if (typeof filename === "object") {
        if (filename.content && filename.encoding === "base64") {
            const bytes = fromBase64(filename.content)
            const mime = await fileTypeFromBuffer(bytes)
            filename = join(folder, "input." + mime.ext)
            await writeFile(filename, bytes)
        } else filename = filename.filename
    }
    return filename
}

async function logFile(filename: string | WorkspaceFile, action: string) {
    filename = filenameOrFileToFilename(filename)
    let stats: Stats
    try {
        stats = await stat(filename)
    } catch {}
    logVerbose(
        `ffmpeg: ${action} ${filename} (${stats ? prettyBytes(stats.size) : "0"})`
    )
}

export class FFmepgClient implements Ffmpeg {
    constructor() {}

    async run(
        input: string | WorkspaceFile,
        builder: (
            cmd: FfmpegCommandBuilder,
            options?: { input: string; dir: string }
        ) => Awaitable<string>,
        options?: FFmpegCommandOptions
    ): Promise<string[]> {
        await logFile(input, "input")
        const { filenames } = await runFfmpeg(input, builder, options || {})
        for (const filename of filenames) await logFile(filename, "output")
        return filenames
    }

    async extractFrames(
        filename: string | WorkspaceFile,
        options?: VideoExtractFramesOptions
    ): Promise<string[]> {
        if (!filename) throw new Error("filename is required")

        const { transcript, ...soptions } = options || {}
        if (transcript?.segments?.length)
            soptions.timestamps = transcript.segments.map((s) => s.start)
        if (!soptions.count && !soptions.timestamps) soptions.count = 5

        const res = await this.run(
            filename,
            async (cmd, fopts) => {
                const { dir } = fopts
                const c = cmd as FfmpegCommand
                c.outputOptions("-threads", "1")
                c.screenshots({
                    ...soptions,
                    filename: "%b_%i.png",
                    folder: dir,
                })
                return undefined
            },
            { ...soptions, cache: "frames" }
        )
        logVerbose(`ffmpeg: extracted ${res.length} frames`)
        return res
    }

    async extractAudio(
        filename: string | WorkspaceFile,
        options?: VideoExtractAudioOptions
    ): Promise<string> {
        if (!filename) throw new Error("filename is required")

        const { forceConversion, ...foptions } = options || {}
        const { transcription } = foptions
        if (
            !forceConversion &&
            !transcription &&
            typeof filename === "string"
        ) {
            const mime = lookupMime(filename)
            if (/^audio/.test(mime)) return filename
        }
        const res = await this.run(
            filename,
            async (cmd, fopts) => {
                cmd.noVideo()
                if (transcription) {
                    // https://community.openai.com/t/whisper-api-increase-file-limit-25-mb/566754
                    cmd.audioCodec("libopus")
                    cmd.audioChannels(1)
                    cmd.audioBitrate("12k")
                    cmd.outputOptions("-map_metadata -1")
                    cmd.outputOptions("-application voip")
                    cmd.toFormat("ogg")
                    return "audio.ogg"
                } else {
                    cmd.toFormat("mp3")
                    return "audio.mp3"
                }
            },
            { ...foptions, cache: foptions.cache || "audio-voip" }
        )
        return res[0]
    }

    async probe(filename: string | WorkspaceFile): Promise<VideoProbeResult> {
        if (!filename) throw new Error("filename is required")
        const res = await runFfmpeg(
            filename,
            async (cmd) => {
                const res = new Promise<VideoProbeResult>((resolve, reject) => {
                    cmd.ffprobe((err, data) => {
                        if (err) reject(err)
                        else resolve(data as any as VideoProbeResult)
                    })
                })
                const meta = await res
                return meta
            },
            { cache: "probe" }
        )
        return res.data as VideoProbeResult
    }
}

async function runFfmpeg(
    filename: string | WorkspaceFile,
    renderer: (
        cmd: FfmpegCommand,
        options: { input: string; dir: string }
    ) => Awaitable<string | object>,
    options?: FFmpegCommandOptions
): Promise<{ filenames: string[]; data?: any }> {
    if (!filename) throw new Error("filename is required")
    const { cache } = options || {}
    const folder = await computeHashFolder(filename, options)
    const resFilename = join(folder, "res.json")
    const readCache = async () => {
        if (cache === false) return undefined
        try {
            const res = JSON.parse(
                await readFile(resFilename, {
                    encoding: "utf-8",
                })
            )
            logVerbose(`ffmpeg: cache hit at ${folder}`)
            return res
        } catch {
            return undefined
        }
    }

    // try to hit cache before limit on ffmpeg
    {
        const cached = await readCache()
        if (cached) return cached
    }

    return ffmpegLimit(async () => {
        // try cache hit again
        {
            const cached = await readCache()
            if (cached) return cached
        }

        await ensureDir(folder)
        const input = await resolveInput(filename, folder)
        const cmd = await ffmpegCommand({})
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
            const end = () => resolve(r)

            cmd.input(input)
            if (options.inputOptions)
                cmd.inputOptions(...arrayify(options.inputOptions))
            if (options.outputOptions)
                cmd.outputOption(...arrayify(options.outputOptions))
            cmd.addListener("filenames", (fns: string[]) => {
                r.filenames.push(...fns.map((f) => join(folder, f)))
            })
            cmd.addListener("end", end)
            cmd.addListener("error", (err) => reject(err))
            try {
                let rendering = await renderer(cmd, {
                    input,
                    dir: folder,
                })
                if (typeof rendering === "string") {
                    let output: string = join(folder, basename(rendering))
                    r.filenames.push(output)
                    cmd.output(output)
                    cmd.run()
                } else if (typeof rendering === "object") {
                    r.data = rendering
                    cmd.removeListener("end", end)
                    resolve(r)
                }
            } catch (err) {
                reject(err)
            }
        })

        logVerbose(`ffmpeg: result at ${resFilename}`)
        await writeFile(resFilename, JSON.stringify(res, null, 2))
        return res
    })
}
