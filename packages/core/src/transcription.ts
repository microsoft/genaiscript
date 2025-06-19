import { parse } from "@plussub/srt-vtt-parser";
import { deleteEmptyValues, deleteUndefinedValues } from "./cleaners";

/**
 * Renders SRT and VTT formats from a transcription result.
 *
 * This function generates SRT and VTT string formats based on the segments
 * in the given transcription result and appends them to the transcription object.
 *
 * Parameters:
 * - transcription: An object containing transcription data, including an array of segments.
 *   Each segment should include `start`, `end`, and `text` fields.
 *
 * Returns:
 * - The updated transcription object with `srt` and `vtt` properties added.
 *
 * Internal Functions:
 * - formatSRTTime: Converts a timestamp in seconds to the SRT time format (hh:mm:ss,SSS).
 * - formatVRTTime: Converts a timestamp in seconds to the VTT time format (hh:mm:ss.SSS).
 *   Omits hours if set to 00.
 */
export function srtVttRender(transcription: TranscriptionResult) {
  const segments = transcription.segments;
  if (!segments) return transcription;

  const srt = segments
    .map((segment, index) => {
      const start = formatSRTTime(segment.start);
      const end = formatSRTTime(segment.end);
      return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`;
    })
    .join("\n");
  transcription.srt = srt;

  const vtt =
    "WEBVTT\n\n" +
    segments
      .map((segment, index) => {
        const start = formatVRTTime(segment.start);
        const end = formatVRTTime(segment.end);
        return `${start} --> ${end}\n${segment.text.trim()}\n`;
      })
      .join("\n");
  transcription.vtt = vtt;

  return transcription;

  function formatSRTTime(seconds: number): string {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const secondsPart = String(date.getUTCSeconds()).padStart(2, "0");
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
    const time = `${hours}:${minutes}:${secondsPart},${milliseconds}`;
    return time.replace(".", ",");
  }

  function formatVRTTime(seconds: number): string {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const secondsPart = String(date.getUTCSeconds()).padStart(2, "0");
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
    let time = `${minutes}:${secondsPart}.${milliseconds}`;
    if (hours !== "00") time = hours + ":" + time;
    return time;
  }
}

/**
 * Parses timestamps enclosed in square brackets from the given transcription string.
 *
 * Parameters:
 * - transcription: A string containing transcription text with timestamps enclosed in square brackets.
 *
 * Returns:
 * - An array of extracted timestamp strings in the format `[hh:mm:ss.sss]` or `[mm:ss.sss]`.
 */
export function parseTimestamps(transcription: string) {
  let ts: string[] = [];
  transcription?.replace(/\[((\d{2}:)?\d{2}:\d{2}(.\d{3})?)\]/g, (match, p1) => {
    ts.push(p1);
    return "";
  });
  return ts;
}

/**
 * Parses a transcription string in VTT or SRT format and converts it into an array of transcription segments.
 *
 * Parameters:
 * - transcription: The transcription string to be parsed. Expected to be in valid VTT or SRT format.
 *
 * Returns:
 * - An array of transcription segments, where each segment contains the ID, start time, end time, and text of the segment.
 */
export function vttSrtParse(transcription: string): TranscriptionSegment[] {
  if (!transcription) return [];
  const p = parse(transcription);
  return p.entries.map((e) =>
    deleteEmptyValues({
      id: e.id,
      start: e.from,
      end: e.to,
      text: e.text,
    }),
  );
}
