import { FFmepgClient } from "../../core/src/ffmpeg";

/**
 * Extracts audio from a given media file.
 *
 * @param file - The path to the input media file.
 * @param options - Configuration options for audio extraction.
 * @param options.force - Whether to force audio conversion regardless of input format.
 * @param options.transcription - Whether to enable audio transcription during the extraction process.
 *
 * Logs the resulting audio file path upon completion.
 */
export async function extractAudio(
  file: string,
  options: { force: boolean; transcription: boolean },
) {
  const { force, transcription } = options || {};
  const ffmpeg = new FFmepgClient();
  const fn = await ffmpeg.extractAudio(file, {
    transcription,
    forceConversion: force,
  });
  console.log(fn);
}

/**
 * Extracts video frames based on the specified options and logs the filenames of the extracted frames.
 *
 * @param file - The path to the video file.
 * @param options - An object specifying frame extraction options:
 *   - timestamps: An array of specific timestamps (in seconds) to extract frames from.
 *   - count: The number of frames to extract.
 *   - size: The dimensions of the output frames (e.g., "1920x1080").
 *   - format: The format of the extracted frames (e.g., "png", "jpg").
 *   - keyframes: Whether to extract keyframes only.
 *   - sceneThreshold: A threshold value to detect scene changes for frame extraction.
 */
export async function extractVideoFrames(
  file: string,
  options: {
    timestamps?: number[];
    count?: number;
    size?: string;
    format?: string;
    keyframes?: boolean;
    sceneThreshold?: number;
  },
) {
  const { ...rest } = options || {};
  const ffmpeg = new FFmepgClient();
  const frames = await ffmpeg.extractFrames(file, {
    ...rest,
  });
  for (let i = 0; i < frames.length; i++) {
    const fn = frames[i];
    console.log(`${fn}`);
  }
}

/**
 * Probes the provided video file and retrieves detailed metadata.
 *
 * @param file - Path to the video file to be analyzed.
 * Logs the metadata of the video file in JSON format.
 */
export async function probeVideo(file: string) {
  const ffmpeg = new FFmepgClient();
  const res = await ffmpeg.probe(file);
  console.log(JSON.stringify(res, null, 2));
}
