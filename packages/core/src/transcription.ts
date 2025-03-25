import { parse } from "@plussub/srt-vtt-parser"
import { deleteEmptyValues, deleteUndefinedValues } from "./cleaners"

/**
 * Converts a transcription result into SRT and VTT formats.
 * 
 * This function processes the segments of a transcription, formats their 
 * start and end times into SRT and VTT timestamp formats, and generates 
 * the corresponding SRT and VTT string representations. The results are 
 * added to the transcription object.
 *
 * @param transcription - The transcription result containing segments.
 * @returns The updated transcription object with SRT and VTT properties.
 */
export function srtVttRender(transcription: TranscriptionResult) {
    const segments = transcription.segments
    if (!segments) return transcription

    const srt = segments
        .map((segment, index) => {
            const start = formatSRTTime(segment.start)
            const end = formatSRTTime(segment.end)
            return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`
        })
        .join("\n")
    transcription.srt = srt

    const vtt =
        "WEBVTT\n\n" +
        segments
            .map((segment, index) => {
                const start = formatVRTTime(segment.start)
                const end = formatVRTTime(segment.end)
                return `${start} --> ${end}\n${segment.text.trim()}\n`
            })
            .join("\n")
    transcription.vtt = vtt

    return transcription

    function formatSRTTime(seconds: number): string {
        const date = new Date(0)
        date.setMilliseconds(seconds * 1000)
        const hours = String(date.getUTCHours()).padStart(2, "0")
        const minutes = String(date.getUTCMinutes()).padStart(2, "0")
        const secondsPart = String(date.getUTCSeconds()).padStart(2, "0")
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")
        const time = `${hours}:${minutes}:${secondsPart},${milliseconds}`
        return time.replace(".", ",")
    }

    function formatVRTTime(seconds: number): string {
        const date = new Date(0)
        date.setMilliseconds(seconds * 1000)
        const hours = String(date.getUTCHours()).padStart(2, "0")
        const minutes = String(date.getUTCMinutes()).padStart(2, "0")
        const secondsPart = String(date.getUTCSeconds()).padStart(2, "0")
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")
        let time = `${minutes}:${secondsPart}.${milliseconds}`
        if (hours !== "00") time = hours + ":" + time
        return time
    }
}

/**
 * Extracts timestamps from a transcription string formatted with square brackets.
 * The timestamps are expected to be in the format [hh:mm:ss.sss] or [mm:ss.sss].
 *
 * @param transcription - The transcription string containing timestamps.
 * @returns An array of extracted timestamp strings.
 */
export function parseTimestamps(transcription: string) {
    let ts: string[] = []
    transcription?.replace(
        /\[((\d{2}:)?\d{2}:\d{2}(.\d{3})?)\]/g,
        (match, p1) => {
            ts.push(p1)
            return ""
        }
    )
    return ts
}

/**
 * Parses a VTT transcription string into an array of transcription segments.
 * Extracts individual entries, mapping them to a structured format while removing any
 * empty values from the result.
 *
 * @param transcription - The VTT transcription string to be parsed.
 * @returns An array of transcription segments derived from the parsed VTT entries.
 */
export function vttSrtParse(transcription: string): TranscriptionSegment[] {
    if (!transcription) return []
    const p = parse(transcription)
    return p.entries.map((e) =>
        deleteEmptyValues({
            id: e.id,
            start: e.from,
            end: e.to,
            text: e.text,
        })
    )
}
