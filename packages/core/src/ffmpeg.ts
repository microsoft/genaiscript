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
import { appendFile, readdir, stat } from "node:fs/promises"
import prettyBytes from "pretty-bytes"
import { filenameOrFileToFilename } from "./unwrappers"
import { Stats } from "node:fs"
import { roundWithPrecision } from "./precision"

const ffmpegLimit = pLimit(1)

type FFmpegCommandRenderer = (
    cmd: FfmpegCommand,
    options: { input: string; dir: string }
) => Awaitable<string | object>

interface FFmpegCommandResult {
    filenames: string[]
    data: any[]
}

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
    return dotGenaiscriptPath("cache", "ffmpeg", h)
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

        const {
            transcript,
            count,
            cache = "frames",
            ...soptions
        } = options || {}
        const format = options?.format || "jpg"
        const size = options?.size

        const renderers: FFmpegCommandRenderer[] = []
        if (soptions.keyframes || (!count && !soptions.timestamps?.length)) {
            renderers.push((cmd) => {
                if (size) {
                    cmd.size(size)
                    cmd.autopad()
                }
                cmd.videoFilter("select='eq(pict_type,I)'")
                cmd.outputOptions("-vsync vfr")
                cmd.outputOptions("-frame_pts 1")
                return `keyframe_%03d.${format}`
            })
        } else {
            if (transcript?.segments?.length && !soptions.timestamps?.length)
                soptions.timestamps = transcript.segments.map((s) => s.start)
            if (count && !soptions.timestamps?.length) {
                const info = await this.probeVideo(filename)
                const duration = Number(info.duration)
                if (count === 1) soptions.timestamps = [0]
                else
                    soptions.timestamps = Array(count)
                        .fill(0)
                        .map((_, i) =>
                            roundWithPrecision(
                                Math.min(
                                    (i * duration) / (count - 1),
                                    duration - 0.1
                                ),
                                3
                            )
                        )
            }
            if (!soptions.timestamps?.length) soptions.timestamps = [0]
            renderers.push(
                ...soptions.timestamps.map(
                    (ts) =>
                        ((cmd) => {
                            cmd.seekInput(ts)
                            cmd.frames(1)
                            if (size) {
                                cmd.size(size)
                                cmd.autopad()
                            }
                            return `frame-${String(ts).replace(":", "-").replace(".", "_")}.${format}`
                        }) as FFmpegCommandRenderer
                )
            )
        }

        await logFile(filename, "input")
        const { filenames } = await runFfmpeg(filename, renderers, {
            ...soptions,
            cache,
        })
        logVerbose(`ffmpeg: extracted ${filenames.length} frames`)
        for (const filename of filenames) await logFile(filename, "output")
        return filenames
    }

    async extractAudio(
        filename: string | WorkspaceFile,
        options?: VideoExtractAudioOptions
    ): Promise<string> {
        if (!filename) throw new Error("filename is required")

        const { forceConversion, ...foptions } = options || {}
        const { transcription = true } = foptions
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
        return res.data[0] as VideoProbeResult
    }

    async probeVideo(filename: string | WorkspaceFile) {
        const meta = await this.probe(filename)
        const vstream = meta.streams.reduce((biggest, stream) => {
            if (
                stream.codec_type === "video" &&
                stream.width &&
                stream.height &&
                (!biggest ||
                    stream.width * stream.height >
                        biggest.width * biggest.height)
            ) {
                return stream
            } else {
                return biggest
            }
        })
        return vstream
    }
}

async function runFfmpeg(
    filename: string | WorkspaceFile,
    renderer: FFmpegCommandRenderer | FFmpegCommandRenderer[],
    options?: FFmpegCommandOptions
): Promise<FFmpegCommandResult> {
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

        const res: FFmpegCommandResult = { filenames: [], data: [] }
        const renderers = arrayify(renderer)
        for (const renderer of renderers) {
            const cmd = await ffmpegCommand({})
            logCommand(folder, cmd)
            const rres = await runFfmpegCommandUncached(
                cmd,
                input,
                options,
                folder,
                renderer
            )
            if (rres.filenames?.length) res.filenames.push(...rres.filenames)
            if (rres.data?.length) res.data.push(...rres.data)
        }
        await writeFile(resFilename, JSON.stringify(res, null, 2))
        return res
    })
}
async function runFfmpegCommandUncached(
    cmd: FfmpegCommand,
    input: string,
    options: FFmpegCommandOptions,
    folder: string,
    renderer: FFmpegCommandRenderer
): Promise<FFmpegCommandResult> {
    return await new Promise(async (resolve, reject) => {
        const r: FFmpegCommandResult = { filenames: [], data: [] }
        const end = () => resolve(r)

        const WILD_CARD = "%03d"

        let output: string
        cmd.input(input)
        if (options.size) cmd.size(options.size)
        if (options.inputOptions)
            cmd.inputOptions(...arrayify(options.inputOptions))
        if (options.outputOptions)
            cmd.outputOption(...arrayify(options.outputOptions))
        cmd.addListener("filenames", (fns: string[]) => {
            r.filenames.push(...fns.map((f) => join(folder, f)))
        })
        cmd.addListener("end", async () => {
            if (output?.includes(WILD_CARD)) {
                const [prefix, suffix] = output.split(WILD_CARD, 2)
                const files = await readdir(folder)
                const gen = files.filter(
                    (f) => f.startsWith(prefix) && f.endsWith(suffix)
                )
                r.filenames.push(...gen.map((f) => join(folder, f)))
                console.log({ prefix, suffix, files, gen })
            }
            end()
        })
        cmd.addListener("error", (err) => reject(err))
        try {
            const rendering = await renderer(cmd, {
                input,
                dir: folder,
            })
            if (typeof rendering === "string") {
                output = rendering
                const fo = join(folder, basename(rendering))
                cmd.output(fo)
                cmd.run()
                if (!rendering.includes(WILD_CARD)) r.filenames.push(fo)
            } else if (typeof rendering === "object") {
                r.data.push(rendering)
                cmd.removeListener("end", end)
                resolve(r)
            }
        } catch (err) {
            reject(err)
        }
    })
}

function logCommand(folder: string, cmd: FfmpegCommand) {
    // console logging
    cmd.on("start", (commandLine) => logVerbose(commandLine))
    if (process.env.FFMPEG_DEBUG) cmd.on("stderr", (s) => logVerbose(s))

    // log to file
    const log: string[] = []
    const writeLog = async () => {
        const logFilename = join(folder, "log.txt")
        logVerbose(`ffmpeg log: ${logFilename}`)
        await appendFile(logFilename, log.join("\n"), {
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
