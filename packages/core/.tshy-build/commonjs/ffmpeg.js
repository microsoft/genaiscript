"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmepgClient = void 0;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("genaiscript:ffmpeg");
const util_js_1 = require("./util.js");
const mime_js_1 = require("./mime.js");
const p_limit_1 = __importDefault(require("p-limit"));
const node_path_1 = require("node:path");
const fs_js_1 = require("./fs.js");
const crypto_js_1 = require("./crypto.js");
const constants_js_1 = require("./constants.js");
const promises_1 = require("node:fs/promises");
const error_js_1 = require("./error.js");
const base64_js_1 = require("./base64.js");
const filetype_js_1 = require("./filetype.js");
const promises_2 = require("node:fs/promises");
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const unwrappers_js_1 = require("./unwrappers.js");
const precision_js_1 = require("./precision.js");
const transcription_js_1 = require("./transcription.js");
const performance_js_1 = require("./performance.js");
const workdir_js_1 = require("./workdir.js");
const cleaners_js_1 = require("./cleaners.js");
const fs_js_2 = require("./fs.js");
const ffmpegLimit = (0, p_limit_1.default)(1);
const WILD_CARD = "%06d";
async function ffmpegCommand(options) {
    const cmd = (await import("fluent-ffmpeg")).default;
    return cmd(options);
}
async function computeHashFolder(filename, options) {
    const { trace, salt, ...rest } = options;
    const h = await (0, crypto_js_1.hash)([typeof filename === "string" ? { filename } : filename, rest], {
        readWorkspaceFiles: true,
        version: true,
        length: constants_js_1.VIDEO_HASH_LENGTH,
        salt,
    });
    return (0, workdir_js_1.dotGenaiscriptPath)("cache", "ffmpeg", h);
}
async function resolveInput(filename, folder) {
    if (typeof filename === "object") {
        if (filename.content && filename.encoding === "base64") {
            const bytes = (0, base64_js_1.fromBase64)(filename.content);
            const mime = await (0, filetype_js_1.fileTypeFromBuffer)(bytes);
            filename = (0, node_path_1.join)(folder, "input." + mime.ext);
            await (0, promises_1.writeFile)(filename, bytes);
        }
        else {
            filename = filename.filename;
        }
    }
    return filename;
}
async function logFile(filename, action) {
    filename = (0, unwrappers_js_1.filenameOrFileToFilename)(filename);
    const stats = await (0, fs_js_2.tryStat)(filename);
    (0, util_js_1.logVerbose)(`ffmpeg: ${action} ${filename} (${stats ? (0, pretty_bytes_1.default)(stats.size) : "0"})`);
}
class FFmepgClient {
    constructor() { }
    async run(input, builder, options) {
        await logFile(input, "input");
        const { filenames } = await runFfmpeg(input, builder, options || {});
        for (const filename of filenames) {
            await logFile(filename, "output");
        }
        return filenames;
    }
    async extractFrames(filename, options) {
        if (!filename) {
            throw new Error("filename is required");
        }
        (0, performance_js_1.mark)("ffmpeg.extractFrames");
        const { transcript, count, cache = "frames", ...soptions } = options || {};
        const format = options?.format || "jpg";
        const size = options?.size;
        const applyOptions = (cmd) => {
            if (size) {
                cmd.size(size);
                cmd.autopad();
            }
        };
        const renderers = [];
        if (soptions.keyframes ||
            (!count && !soptions.timestamps?.length && !(soptions.sceneThreshold > 0))) {
            renderers.push((cmd) => {
                cmd.videoFilter("select='eq(pict_type,I)'");
                cmd.outputOptions("-fps_mode vfr");
                cmd.outputOptions("-frame_pts 1");
                applyOptions(cmd);
                return `keyframe_*.${format}`;
            });
        }
        else if (soptions.sceneThreshold > 0) {
            renderers.push(((cmd) => {
                cmd.frames(1);
                applyOptions(cmd);
                return `scenes_000000.${format}`;
            }), ((cmd) => {
                cmd.videoFilter(`select='gt(scene,${soptions.sceneThreshold})',showinfo`);
                cmd.outputOptions("-fps_mode passthrough");
                cmd.outputOptions("-frame_pts 1");
                applyOptions(cmd);
                return `scenes_*.${format}`;
            }));
        }
        else {
            if (typeof transcript === "string") {
                soptions.timestamps = (0, transcription_js_1.parseTimestamps)(transcript);
            }
            else if (typeof transcript === "object" &&
                transcript?.segments?.length &&
                !soptions.timestamps?.length) {
                soptions.timestamps = transcript.segments.map((s) => s.start);
            }
            if (count && !soptions.timestamps?.length) {
                dbg(`calculating timestamps for count: ${count}`);
                const info = await this.probeVideo(filename);
                const duration = Number(info.duration);
                if (count === 1) {
                    soptions.timestamps = [0];
                }
                else {
                    soptions.timestamps = Array(count)
                        .fill(0)
                        .map((_, i) => (0, precision_js_1.roundWithPrecision)(Math.min((i * duration) / (count - 1), duration - 0.1), 3));
                }
            }
            if (!soptions.timestamps?.length) {
                dbg(`timestamps not provided, defaulting to [0]`);
                soptions.timestamps = [0];
            }
            renderers.push(...soptions.timestamps.map((ts) => ((cmd) => {
                cmd.seekInput(ts);
                cmd.frames(1);
                applyOptions(cmd);
                return `frame-${String(ts).replace(":", "-").replace(".", "_")}.${format}`;
            })));
        }
        await logFile(filename, "input");
        const { filenames } = await runFfmpeg(filename, renderers, {
            ...soptions,
            cache,
            salt: {
                transcript,
                count,
                format,
                size,
            },
        });
        (0, util_js_1.logVerbose)(`ffmpeg: extracted ${filenames.length} frames`);
        for (const filename of filenames) {
            await logFile(filename, "output");
        }
        return filenames;
    }
    async extractAudio(filename, options) {
        if (!filename) {
            throw new Error("filename is required");
        }
        const { forceConversion, ...foptions } = options || {};
        const { transcription = true } = foptions;
        if (!forceConversion && !transcription && typeof filename === "string") {
            const mime = (0, mime_js_1.lookupMime)(filename);
            if (/^audio/.test(mime)) {
                dbg(`filename is already an audio file: ${filename}`);
                return filename;
            }
        }
        const res = await this.run(filename, async (cmd) => {
            cmd.noVideo();
            if (transcription) {
                // https://community.openai.com/t/whisper-api-increase-file-limit-25-mb/566754
                cmd.audioCodec("libopus");
                cmd.audioChannels(1);
                cmd.audioBitrate("12k");
                cmd.outputOptions("-map_metadata -1");
                cmd.outputOptions("-application voip");
                cmd.toFormat("ogg");
                return "audio.ogg";
            }
            else {
                cmd.toFormat("mp3");
                return "audio.mp3";
            }
        }, {
            ...foptions,
            cache: foptions.cache || "audio-voip",
            salt: {
                transcription,
            },
        });
        return res[0];
    }
    async extractClip(filename, options) {
        if (!filename) {
            throw new Error("filename is required");
        }
        const { start, duration, end, ...rest } = options || {};
        const res = await this.run(filename, async (cmd) => {
            cmd.seekInput(start);
            if (duration !== undefined) {
                cmd.duration(duration);
            }
            if (end !== undefined) {
                cmd.inputOptions(`-to ${end}`);
            }
            if (!options?.size) {
                cmd.outputOptions("-c copy");
            }
            return `clip-${start}-${duration || end}.mp4`;
        }, {
            ...rest,
            salt: {
                start,
                duration,
                end,
            },
        });
        return res[0];
    }
    async probe(filename) {
        if (!filename) {
            throw new Error("filename is required");
        }
        const res = await runFfmpeg(filename, async (cmd) => {
            const res = new Promise((resolve, reject) => {
                cmd.ffprobe((err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            const meta = await res;
            return meta;
        }, { cache: "probe" });
        return res.data[0];
    }
    async probeVideo(filename) {
        const meta = await this.probe(filename);
        const vstream = meta.streams.reduce((biggest, stream) => {
            if (stream.codec_type === "video" &&
                stream.width &&
                stream.height &&
                (!biggest || stream.width * stream.height > biggest.width * biggest.height)) {
                return stream;
            }
            else {
                return biggest;
            }
        });
        return vstream;
    }
}
exports.FFmepgClient = FFmepgClient;
async function runFfmpeg(filename, renderer, options) {
    if (!filename) {
        throw new Error("filename is required");
    }
    const { cache } = options || {};
    const folder = await computeHashFolder(filename, options);
    const resFilename = (0, node_path_1.join)(folder, "res.json");
    const readCache = async () => {
        if (cache === false) {
            return undefined;
        }
        try {
            dbg(`reading cache from: ${resFilename}`);
            const res = JSON.parse(await (0, promises_1.readFile)(resFilename, {
                encoding: "utf-8",
            }));
            (0, util_js_1.logVerbose)(`ffmpeg: cache hit at ${folder}`);
            return res;
        }
        catch {
            return undefined;
        }
    };
    // try to hit cache before limit on ffmpeg
    {
        const cached = await readCache();
        if (cached) {
            return cached;
        }
    }
    return ffmpegLimit(async () => {
        // try cache hit again
        {
            const cached = await readCache();
            if (cached) {
                return cached;
            }
        }
        await (0, fs_js_1.ensureDir)(folder);
        const input = await resolveInput(filename, folder);
        const res = { filenames: [], data: [] };
        const renderers = (0, cleaners_js_1.arrayify)(renderer);
        for (const renderer of renderers) {
            const cmd = await ffmpegCommand({});
            logCommand(folder, cmd);
            const rres = await runFfmpegCommandUncached(cmd, input, options, folder, renderer);
            if (rres.filenames?.length) {
                res.filenames.push(...rres.filenames);
            }
            if (rres.data?.length) {
                res.data.push(...rres.data);
            }
        }
        dbg(`writing ffmpeg result to cache: ${resFilename}`);
        await (0, promises_1.writeFile)(resFilename, JSON.stringify(res, null, 2));
        return res;
    });
}
async function runFfmpegCommandUncached(cmd, input, options, folder, renderer) {
    return await new Promise(async (resolve, reject) => {
        const r = { filenames: [], data: [] };
        const end = () => resolve(r);
        let output;
        cmd.input(input);
        if (options.size) {
            cmd.size(options.size);
        }
        if (options.inputOptions) {
            cmd.inputOptions(...(0, cleaners_js_1.arrayify)(options.inputOptions));
        }
        if (options.outputOptions) {
            cmd.outputOption(...(0, cleaners_js_1.arrayify)(options.outputOptions));
        }
        dbg(`adding filenames listener`);
        cmd.addListener("filenames", (fns) => {
            r.filenames.push(...fns.map((f) => (0, node_path_1.join)(folder, f)));
        });
        cmd.addListener("codeData", (data) => {
            (0, util_js_1.logVerbose)(`ffmpeg: input audio ${data.audio}, video ${data.video}`);
        });
        cmd.addListener("end", async () => {
            dbg(`processing wildcard output: ${output}`);
            if (output?.includes(WILD_CARD)) {
                const [prefix, suffix] = output.split(WILD_CARD, 2);
                const files = await (0, promises_2.readdir)(folder);
                const gen = files.filter((f) => f.startsWith(prefix) && f.endsWith(suffix));
                r.filenames.push(...gen.map((f) => (0, node_path_1.join)(folder, f)));
            }
            end();
        });
        cmd.addListener("error", (err) => {
            dbg(`ffmpeg command encountered an error`);
            reject(err);
        });
        try {
            const rendering = await renderer(cmd, {
                input,
                dir: folder,
            });
            if (typeof rendering === "string") {
                output = rendering.replace(/\*/g, WILD_CARD);
                const fo = (0, node_path_1.join)(folder, (0, node_path_1.basename)(output));
                cmd.output(fo);
                cmd.run();
                if (!output.includes(WILD_CARD)) {
                    r.filenames.push(fo);
                }
            }
            else if (typeof rendering === "object") {
                r.data.push(rendering);
                cmd.removeListener("end", end);
                resolve(r);
            }
        }
        catch (err) {
            reject(err);
        }
    });
}
function logCommand(folder, cmd) {
    // console logging
    cmd.on("start", (commandLine) => (0, util_js_1.logVerbose)(commandLine));
    cmd.on("stderr", (s) => dbg(s));
    // log to file
    const log = [];
    const writeLog = async () => {
        const logFilename = (0, node_path_1.join)(folder, "log.txt");
        (0, util_js_1.logVerbose)(`ffmpeg log: ${logFilename}`);
        await (0, promises_2.appendFile)(logFilename, log.join("\n"), {
            encoding: "utf-8",
        });
    };
    cmd.on("stderr", (s) => log.push(s));
    cmd.on("end", writeLog);
    cmd.on("error", async (err) => {
        log.push(`error: ${(0, error_js_1.errorMessage)(err)}\n${(0, error_js_1.serializeError)(err)}`);
        await writeLog();
    });
}
//# sourceMappingURL=ffmpeg.js.map