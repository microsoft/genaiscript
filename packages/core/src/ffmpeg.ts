// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:ffmpeg");

import { logVerbose } from "./util.js";
import type { TraceOptions } from "./trace.js";
import { lookupMime } from "./mime.js";
import pLimit from "p-limit";
import { join, basename } from "node:path";
import { ensureDir } from "./fs.js";
import { hash } from "./crypto.js";
import { VIDEO_HASH_LENGTH } from "./constants.js";
import { writeFile, readFile } from "node:fs/promises";
import { errorMessage, serializeError } from "./error.js";
import { fromBase64 } from "./base64.js";
import { fileTypeFromBuffer } from "./filetype.js";
import { appendFile, readdir } from "node:fs/promises";
import prettyBytes from "pretty-bytes";
import { filenameOrFileToFilename } from "./unwrappers.js";
import { roundWithPrecision } from "./precision.js";
import { parseTimestamps } from "./transcription.js";
import { mark } from "./performance.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { arrayify } from "./cleaners.js";
import { tryStat } from "./fs.js";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import type {
  Awaitable,
  Ffmpeg,
  FfmpegCommandBuilder,
  FFmpegCommandOptions,
  VideoExtractAudioOptions,
  VideoExtractClipOptions,
  VideoExtractFramesOptions,
  VideoProbeResult,
  WorkspaceFile,
} from "./types.js";

const ffmpegLimit = pLimit(1);
const WILD_CARD = "%06d";

class MinimalFfmpegCommand extends EventEmitter implements FfmpegCommandBuilder {
  private args: string[] = [];
  private inputFile: string = "";
  private outputFile: string = "";
  private timeout?: number;
  private static WILD_CARD = WILD_CARD; // Make it accessible to the class

  constructor(options?: { timeout?: number }) {
    super();
    this.timeout = options?.timeout;
    dbg(`Creating new MinimalFfmpegCommand with timeout: ${this.timeout || 'none'}`);
  }

  // Input/Output management
  input(file: string): this {
    dbg(`Setting input file: ${file}`);
    this.inputFile = file;
    return this;
  }

  output(file: string): this {
    dbg(`Setting output file: ${file}`);
    this.outputFile = file;
    return this;
  }

  // FfmpegCommandBuilder interface implementation
  seekInput(startTime: number | string): FfmpegCommandBuilder {
    dbg(`Adding seek input: ${startTime}`);
    this.args.push("-ss", String(startTime));
    return this;
  }

  duration(duration: number | string): FfmpegCommandBuilder {
    dbg(`Adding duration: ${duration}`);
    this.args.push("-t", String(duration));
    return this;
  }

  noVideo(): FfmpegCommandBuilder {
    this.args.push("-vn");
    return this;
  }

  noAudio(): FfmpegCommandBuilder {
    this.args.push("-an");
    return this;
  }

  audioCodec(codec: string): FfmpegCommandBuilder {
    this.args.push("-acodec", codec);
    return this;
  }

  audioBitrate(bitrate: string | number): FfmpegCommandBuilder {
    this.args.push("-ab", String(bitrate));
    return this;
  }

  audioChannels(channels: number): FfmpegCommandBuilder {
    this.args.push("-ac", String(channels));
    return this;
  }

  audioFrequency(freq: number): FfmpegCommandBuilder {
    this.args.push("-ar", String(freq));
    return this;
  }

  audioQuality(quality: number): FfmpegCommandBuilder {
    this.args.push("-aq", String(quality));
    return this;
  }

  audioFilters(filters: string | string[]): FfmpegCommandBuilder {
    const filterStr = Array.isArray(filters) ? filters.join(",") : filters;
    dbg(`Adding audio filters: ${filterStr}`);
    // Check if we already have audio filters
    const afIndex = this.args.findIndex((arg, i) => arg === "-af" && i < this.args.length - 1);
    if (afIndex >= 0) {
      // Append to existing audio filter
      dbg(`Appending to existing audio filter: ${this.args[afIndex + 1]} -> ${this.args[afIndex + 1]},${filterStr}`);
      this.args[afIndex + 1] += `,${filterStr}`;
    } else {
      this.args.push("-af", filterStr);
    }
    return this;
  }

  toFormat(format: string): FfmpegCommandBuilder {
    this.args.push("-f", format);
    return this;
  }

  videoCodec(codec: string): FfmpegCommandBuilder {
    this.args.push("-vcodec", codec);
    return this;
  }

  videoBitrate(bitrate: string | number, constant?: boolean): FfmpegCommandBuilder {
    if (constant) {
      this.args.push("-vb", String(bitrate));
    } else {
      this.args.push("-vb", String(bitrate));
    }
    return this;
  }

  videoFilters(filters: string | string[]): FfmpegCommandBuilder {
    const filterStr = Array.isArray(filters) ? filters.join(",") : filters;
    dbg(`Adding video filters: ${filterStr}`);
    // Check if we already have video filters
    const vfIndex = this.args.findIndex((arg, i) => arg === "-vf" && i < this.args.length - 1);
    if (vfIndex >= 0) {
      // Append to existing video filter
      dbg(`Appending to existing video filter: ${this.args[vfIndex + 1]} -> ${this.args[vfIndex + 1]},${filterStr}`);
      this.args[vfIndex + 1] += `,${filterStr}`;
    } else {
      this.args.push("-vf", filterStr);
    }
    return this;
  }

  videoFilter(filter: string): FfmpegCommandBuilder {
    return this.videoFilters(filter);
  }

  outputFps(fps: number): FfmpegCommandBuilder {
    this.args.push("-fps", String(fps));
    return this;
  }

  frames(frames: number): FfmpegCommandBuilder {
    this.args.push("-frames:v", String(frames));
    return this;
  }

  keepDisplayAspectRatio(): FfmpegCommandBuilder {
    this.args.push("-aspect");
    return this;
  }

  size(size: string): FfmpegCommandBuilder {
    this.args.push("-s", size);
    return this;
  }

  aspectRatio(aspect: string | number): FfmpegCommandBuilder {
    this.args.push("-aspect", String(aspect));
    return this;
  }

  autopad(pad?: boolean, color?: string): FfmpegCommandBuilder {
    if (pad !== false) {
      // The original fluent-ffmpeg autopad adds padding - we need to chain with existing filters
      const padFilter = `pad=ceil(iw/2)*2:ceil(ih/2)*2${color ? `:${color}` : ""}`;
      // Check if we already have video filters
      const vfIndex = this.args.findIndex((arg, i) => arg === "-vf" && i < this.args.length - 1);
      if (vfIndex >= 0) {
        // Append to existing video filter
        this.args[vfIndex + 1] += `,${padFilter}`;
      } else {
        this.args.push("-vf", padFilter);
      }
    }
    return this;
  }

  inputOptions(...options: string[]): FfmpegCommandBuilder {
    this.args.push(...options);
    return this;
  }

  outputOptions(...options: string[]): FfmpegCommandBuilder {
    this.args.push(...options);
    return this;
  }

  outputOption(...options: string[]): FfmpegCommandBuilder {
    return this.outputOptions(...options);
  }

  // FFprobe functionality
  ffprobe(callback: (err: Error | null, data?: any) => void): void {
    if (!this.inputFile) {
      dbg(`ffprobe error: no input file specified`);
      callback(new Error("No input file specified for ffprobe"));
      return;
    }

    const args = ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", this.inputFile];
    
    dbg(`Running ffprobe with args: ${args.join(" ")}`);
    const child = spawn("ffprobe", args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      const errorOutput = data.toString();
      stderr += errorOutput;
      dbg(`ffprobe stderr: ${errorOutput.trim()}`);
    });

    child.on("close", (code) => {
      dbg(`ffprobe process exited with code: ${code}`);
      if (code === 0) {
        try {
          if (!stdout.trim()) {
            dbg(`ffprobe warning: empty stdout, using stderr if available`);
            callback(new Error("ffprobe returned empty output"));
            return;
          }
          const data = JSON.parse(stdout);
          dbg(`ffprobe successfully parsed JSON output with ${data.streams?.length || 0} streams`);
          
          // Validate the basic structure expected by VideoProbeResult
          if (!data.streams || !Array.isArray(data.streams)) {
            dbg(`ffprobe error: invalid output structure - missing streams array`);
            callback(new Error("Invalid ffprobe output: missing streams array"));
            return;
          }
          if (!data.format || typeof data.format !== 'object') {
            dbg(`ffprobe error: invalid output structure - missing format object`);
            callback(new Error("Invalid ffprobe output: missing format object"));
            return;
          }
          
          callback(null, data);
        } catch (err) {
          dbg(`ffprobe JSON parse error: ${err.message}`);
          dbg(`Raw stdout: ${stdout}`);
          callback(new Error(`Failed to parse ffprobe output: ${err.message}`));
        }
      } else {
        dbg(`ffprobe failed with stderr: ${stderr}`);
        callback(new Error(`ffprobe failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (err) => {
      dbg(`ffprobe process error: ${err.message}`);
      if (err.message.includes("ENOENT")) {
        callback(new Error("ffprobe command not found. Please install FFmpeg to use video probing functionality."));
      } else {
        callback(err);
      }
    });
  }

  // Command execution
  run(): void {
    const args = [...this.args];
    
    if (this.inputFile) {
      args.unshift("-i", this.inputFile);
    }
    
    if (this.outputFile) {
      args.push(this.outputFile);
    }

    dbg(`Running ffmpeg command: ffmpeg ${args.join(" ")}`);
    this.emit("start", `ffmpeg ${args.join(" ")}`);

    const child = spawn("ffmpeg", args);
    let stderr = "";

    child.stdout.on("data", (data) => {
      // FFmpeg typically outputs progress to stderr, not stdout
      dbg(`ffmpeg stdout: ${data.toString().trim()}`);
    });

    child.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      this.emit("stderr", output);
      
      // Parse ffmpeg output for stream info (similar to codeData event)
      const audioMatch = output.match(/Stream #\d+:\d+.*Audio:/);
      const videoMatch = output.match(/Stream #\d+:\d+.*Video:/);
      if (audioMatch || videoMatch) {
        dbg(`Detected streams - audio: ${!!audioMatch}, video: ${!!videoMatch}`);
        this.emit("codeData", {
          audio: !!audioMatch,
          video: !!videoMatch
        });
      }
    });

    child.on("close", (code) => {
      dbg(`ffmpeg process exited with code: ${code}`);
      if (code === 0) {
        // Emit filenames event if output file contains wildcards
        if (this.outputFile && this.outputFile.includes(MinimalFfmpegCommand.WILD_CARD)) {
          dbg(`Output contains wildcard, filenames will be handled by end event listener`);
          // The actual filename detection will be handled in the end event listener
          // in runFfmpegCommandUncached function
        } else if (this.outputFile) {
          // For single file outputs, emit the filename
          const filename = basename(this.outputFile);
          dbg(`Emitting single filename: ${filename}`);
          this.emit("filenames", [filename]);
        }
        dbg(`Emitting end event`);
        this.emit("end");
      } else {
        const errorMsg = `FFmpeg process exited with code ${code}: ${stderr}`;
        dbg(`FFmpeg error: ${errorMsg}`);
        this.emit("error", new Error(errorMsg));
      }
    });

    child.on("error", (err) => {
      dbg(`ffmpeg process error: ${err.message}`);
      this.emit("error", err);
    });

    if (this.timeout) {
      dbg(`Setting timeout for ${this.timeout}ms`);
      setTimeout(() => {
        dbg(`FFmpeg process timed out, killing with SIGTERM`);
        child.kill("SIGTERM");
        this.emit("error", new Error(`FFmpeg process timed out after ${this.timeout}ms`));
      }, this.timeout);
    }
  }

  // Event listener compatibility with fluent-ffmpeg
  addListener(event: string, listener: (...args: any[]) => void): this {
    return this.on(event, listener);
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    return this.off(event, listener);
  }
}

type FFmpegCommandRenderer = (
  cmd: MinimalFfmpegCommand,
  options: { input: string; dir: string },
) => Awaitable<string | object>;

interface FFmpegCommandResult {
  filenames: string[];
  data: any[];
}

export async function ffmpegCommand(options?: { timeout?: number }) {
  dbg(`Creating ffmpeg command with options: ${JSON.stringify(options || {})}`);
  return new MinimalFfmpegCommand(options);
}

async function computeHashFolder(
  filename: string | WorkspaceFile,
  options: TraceOptions & FFmpegCommandOptions & { salt?: any },
) {
  const { trace, salt, ...rest } = options;
  const h = await hash([typeof filename === "string" ? { filename } : filename, rest], {
    readWorkspaceFiles: true,
    version: true,
    length: VIDEO_HASH_LENGTH,
    salt,
  });
  return dotGenaiscriptPath("cache", "ffmpeg", h);
}

async function resolveInput(filename: string | WorkspaceFile, folder: string): Promise<string> {
  dbg(`Resolving input: ${typeof filename === 'string' ? filename : 'WorkspaceFile object'}`);
  if (typeof filename === "object") {
    if (filename.content && filename.encoding === "base64") {
      const bytes = fromBase64(filename.content);
      const mime = await fileTypeFromBuffer(bytes);
      const resolvedFilename = join(folder, "input." + mime.ext);
      dbg(`Converting base64 WorkspaceFile to: ${resolvedFilename}`);
      await writeFile(resolvedFilename, bytes);
      return resolvedFilename;
    } else {
      dbg(`Using filename from WorkspaceFile: ${filename.filename}`);
      return filename.filename;
    }
  }
  dbg(`Using string filename directly: ${filename}`);
  return filename;
}

async function logFile(filename: string | WorkspaceFile, action: string) {
  filename = filenameOrFileToFilename(filename);
  const stats = await tryStat(filename);
  logVerbose(`ffmpeg: ${action} ${filename} (${stats ? prettyBytes(stats.size) : "0"})`);
}

export class FFmepgClient implements Ffmpeg {
  constructor() {}

  async run(
    input: string | WorkspaceFile,
    builder: (
      cmd: FfmpegCommandBuilder,
      options?: { input: string; dir: string },
    ) => Awaitable<string>,
    options?: FFmpegCommandOptions & { salt?: any },
  ): Promise<string[]> {
    await logFile(input, "input");
    const { filenames } = await runFfmpeg(input, builder, options || {});
    for (const filename of filenames) {
      await logFile(filename, "output");
    }
    return filenames;
  }

  async extractFrames(
    filename: string | WorkspaceFile,
    options?: VideoExtractFramesOptions,
  ): Promise<string[]> {
    if (!filename) {
      throw new Error("filename is required");
    }
    mark("ffmpeg.extractFrames");
    const { transcript, count, cache = "frames", ...soptions } = options || {};
    const format = options?.format || "jpg";
    const size = options?.size;

    const applyOptions = (cmd: MinimalFfmpegCommand) => {
      if (size) {
        cmd.size(size);
        cmd.autopad();
      }
    };

    const renderers: FFmpegCommandRenderer[] = [];
    if (
      soptions.keyframes ||
      (!count && !soptions.timestamps?.length && !(soptions.sceneThreshold > 0))
    ) {
      renderers.push((cmd) => {
        cmd.videoFilter("select='eq(pict_type,I)'");
        cmd.outputOptions("-fps_mode vfr");
        cmd.outputOptions("-frame_pts 1");
        applyOptions(cmd);
        return `keyframe_*.${format}`;
      });
    } else if (soptions.sceneThreshold > 0) {
      renderers.push(
        ((cmd) => {
          cmd.frames(1);
          applyOptions(cmd);
          return `scenes_000000.${format}`;
        }) satisfies FFmpegCommandRenderer,
        ((cmd) => {
          cmd.videoFilter(`select='gt(scene,${soptions.sceneThreshold})',showinfo`);
          cmd.outputOptions("-fps_mode passthrough");
          cmd.outputOptions("-frame_pts 1");
          applyOptions(cmd);
          return `scenes_*.${format}`;
        }) satisfies FFmpegCommandRenderer,
      );
    } else {
      if (typeof transcript === "string") {
        soptions.timestamps = parseTimestamps(transcript);
      } else if (
        typeof transcript === "object" &&
        transcript?.segments?.length &&
        !soptions.timestamps?.length
      ) {
        soptions.timestamps = transcript.segments.map((s) => s.start);
      }
      if (count && !soptions.timestamps?.length) {
        dbg(`calculating timestamps for count: ${count}`);
        const info = await this.probeVideo(filename);
        const duration = Number(info.duration);
        if (count === 1) {
          soptions.timestamps = [0];
        } else {
          soptions.timestamps = Array(count)
            .fill(0)
            .map((_, i) =>
              roundWithPrecision(Math.min((i * duration) / (count - 1), duration - 0.1), 3),
            );
        }
      }
      if (!soptions.timestamps?.length) {
        dbg(`timestamps not provided, defaulting to [0]`);
        soptions.timestamps = [0];
      }
      renderers.push(
        ...soptions.timestamps.map(
          (ts) =>
            ((cmd) => {
              cmd.seekInput(ts);
              cmd.frames(1);
              applyOptions(cmd);
              return `frame-${String(ts).replace(":", "-").replace(".", "_")}.${format}`;
            }) satisfies FFmpegCommandRenderer,
        ),
      );
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
    logVerbose(`ffmpeg: extracted ${filenames.length} frames`);
    for (const filename of filenames) {
      await logFile(filename, "output");
    }
    return filenames;
  }

  async extractAudio(
    filename: string | WorkspaceFile,
    options?: VideoExtractAudioOptions,
  ): Promise<string> {
    if (!filename) {
      throw new Error("filename is required");
    }

    const { forceConversion, ...foptions } = options || {};
    const { transcription = true } = foptions;
    if (!forceConversion && !transcription && typeof filename === "string") {
      const mime = lookupMime(filename);
      if (/^audio/.test(mime)) {
        dbg(`filename is already an audio file: ${filename}`);
        return filename;
      }
    }
    const res = await this.run(
      filename,
      async (cmd) => {
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
        } else {
          cmd.toFormat("mp3");
          return "audio.mp3";
        }
      },
      {
        ...foptions,
        cache: foptions.cache || "audio-voip",
        salt: {
          transcription,
        },
      },
    );
    return res[0];
  }

  async extractClip(
    filename: string | WorkspaceFile,
    options: VideoExtractClipOptions,
  ): Promise<string> {
    if (!filename) {
      throw new Error("filename is required");
    }

    const { start, duration, end, ...rest } = options || {};
    const res = await this.run(
      filename,
      async (cmd) => {
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
      },
      {
        ...rest,
        salt: {
          start,
          duration,
          end,
        },
      },
    );
    return res[0];
  }

  async probe(filename: string | WorkspaceFile): Promise<VideoProbeResult> {
    if (!filename) {
      throw new Error("filename is required");
    }
    dbg(`Starting probe for file: ${typeof filename === 'string' ? filename : filename.filename}`);
    const res = await runFfmpeg(
      filename,
      async (cmd) => {
        const res = new Promise<VideoProbeResult>((resolve, reject) => {
          cmd.ffprobe((err, data) => {
            if (err) {
              dbg(`ffprobe failed in probe method: ${err.message}`);
              reject(err);
            } else {
              dbg(`ffprobe succeeded in probe method`);
              resolve(data as VideoProbeResult);
            }
          });
        });
        const meta = await res;
        return meta;
      },
      { cache: "probe" },
    );
    const result = res.data[0] as VideoProbeResult;
    if (!result) {
      throw new Error("No probe data returned from ffmpeg process");
    }
    return result;
  }

  async probeVideo(filename: string | WorkspaceFile) {
    const meta = await this.probe(filename);
    const vstream = meta.streams.reduce((biggest, stream) => {
      if (
        stream.codec_type === "video" &&
        stream.width &&
        stream.height &&
        (!biggest || stream.width * stream.height > biggest.width * biggest.height)
      ) {
        return stream;
      } else {
        return biggest;
      }
    }, null as any);
    
    if (!vstream) {
      throw new Error("No video stream found in the file");
    }
    
    return vstream;
  }
}

async function runFfmpeg(
  filename: string | WorkspaceFile,
  renderer: FFmpegCommandRenderer | FFmpegCommandRenderer[],
  options?: FFmpegCommandOptions & { salt?: any },
): Promise<FFmpegCommandResult> {
  if (!filename) {
    throw new Error("filename is required");
  }
  const { cache } = options || {};
  const folder = await computeHashFolder(filename, options);
  const resFilename = join(folder, "res.json");
  const readCache = async () => {
    if (cache === false) {
      return undefined;
    }
    try {
      dbg(`reading cache from: ${resFilename}`);
      const res = JSON.parse(
        await readFile(resFilename, {
          encoding: "utf-8",
        }),
      );
      logVerbose(`ffmpeg: cache hit at ${folder}`);
      return res;
    } catch {
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

    await ensureDir(folder);
    const input = await resolveInput(filename, folder);

    const res: FFmpegCommandResult = { filenames: [], data: [] };
    const renderers = arrayify(renderer);
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
    await writeFile(resFilename, JSON.stringify(res, null, 2));
    return res;
  });
}
async function runFfmpegCommandUncached(
  cmd: MinimalFfmpegCommand,
  input: string,
  options: FFmpegCommandOptions,
  folder: string,
  renderer: FFmpegCommandRenderer,
): Promise<FFmpegCommandResult> {
  return await new Promise(async (resolve, reject) => {
    const r: FFmpegCommandResult = { filenames: [], data: [] };
    const end = () => {
      dbg(`Command execution completed with ${r.filenames.length} filenames and ${r.data.length} data items`);
      resolve(r);
    };

    let output: string;
    cmd.input(input);
    if (options.size) {
      dbg(`Applying size option: ${options.size}`);
      cmd.size(options.size);
    }
    if (options.inputOptions) {
      const inputOpts = arrayify(options.inputOptions);
      dbg(`Applying input options: ${inputOpts.join(' ')}`);
      cmd.inputOptions(...inputOpts);
    }
    if (options.outputOptions) {
      const outputOpts = arrayify(options.outputOptions);
      dbg(`Applying output options: ${outputOpts.join(' ')}`);
      cmd.outputOption(...outputOpts);
    }
    dbg(`adding filenames listener`);
    cmd.addListener("filenames", (fns: string[]) => {
      dbg(`Received filenames event: ${fns.join(', ')}`);
      r.filenames.push(...fns.map((f) => join(folder, f)));
    });
    cmd.addListener("codeData", (data) => {
      logVerbose(`ffmpeg: input audio ${data.audio}, video ${data.video}`);
    });
    cmd.addListener("end", async () => {
      dbg(`processing wildcard output: ${output}`);
      if (output?.includes(WILD_CARD)) {
        const [prefix, suffix] = output.split(WILD_CARD, 2);
        dbg(`Looking for wildcard files with prefix '${prefix}' and suffix '${suffix}' in ${folder}`);
        const files = await readdir(folder);
        const gen = files.filter((f) => f.startsWith(prefix) && f.endsWith(suffix));
        dbg(`Found ${gen.length} wildcard files: ${gen.join(', ')}`);
        r.filenames.push(...gen.map((f) => join(folder, f)));
      }
      end();
    });
    cmd.addListener("error", (err) => {
      dbg(`ffmpeg command encountered an error: ${err.message}`);
      reject(err);
    });
    try {
      dbg(`Calling renderer function`);
      const rendering = await renderer(cmd, {
        input,
        dir: folder,
      });
      if (typeof rendering === "string") {
        output = rendering.replace(/\*/g, WILD_CARD);
        const fo = join(folder, basename(output));
        dbg(`Renderer returned string output: ${rendering} -> ${fo}`);
        cmd.output(fo);
        cmd.run();
        if (!output.includes(WILD_CARD)) {
          dbg(`Non-wildcard output, adding to filenames immediately: ${fo}`);
          r.filenames.push(fo);
        }
      } else if (typeof rendering === "object") {
        dbg(`Renderer returned object data, resolving immediately`);
        r.data.push(rendering);
        cmd.removeListener("end", end);
        resolve(r);
      }
    } catch (err) {
      dbg(`Renderer function threw error: ${err.message}`);
      reject(err);
    }
  });
}

function logCommand(folder: string, cmd: MinimalFfmpegCommand) {
  // console logging
  cmd.on("start", (commandLine) => logVerbose(commandLine));
  cmd.on("stderr", (s) => dbg(s));

  // log to file
  const log: string[] = [];
  const writeLog = async () => {
    const logFilename = join(folder, "log.txt");
    logVerbose(`ffmpeg log: ${logFilename}`);
    await appendFile(logFilename, log.join("\n"), {
      encoding: "utf-8",
    });
  };
  cmd.on("stderr", (s) => log.push(s));
  cmd.on("end", writeLog);
  cmd.on("error", async (err) => {
    log.push(`error: ${errorMessage(err)}\n${serializeError(err)}`);
    await writeLog();
  });
}
