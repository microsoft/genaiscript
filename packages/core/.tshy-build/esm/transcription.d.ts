import type { TranscriptionResult, TranscriptionSegment } from "./types.js";
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
export declare function srtVttRender(transcription: TranscriptionResult): TranscriptionResult;
/**
 * Parses timestamps enclosed in square brackets from the given transcription string.
 *
 * Parameters:
 * - transcription: A string containing transcription text with timestamps enclosed in square brackets.
 *
 * Returns:
 * - An array of extracted timestamp strings in the format `[hh:mm:ss.sss]` or `[mm:ss.sss]`.
 */
export declare function parseTimestamps(transcription: string): string[];
/**
 * Parses a transcription string in VTT or SRT format and converts it into an array of transcription segments.
 *
 * Parameters:
 * - transcription: The transcription string to be parsed. Expected to be in valid VTT or SRT format.
 *
 * Returns:
 * - An array of transcription segments, where each segment contains the ID, start time, end time, and text of the segment.
 */
export declare function vttSrtParse(transcription: string): TranscriptionSegment[];
//# sourceMappingURL=transcription.d.ts.map