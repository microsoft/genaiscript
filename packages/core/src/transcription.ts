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
        date.setSeconds(seconds)
        const hours = String(date.getUTCHours()).padStart(2, "0")
        const minutes = String(date.getUTCMinutes()).padStart(2, "0")
        const secondsPart = String(date.getUTCSeconds()).padStart(2, "0")
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")
        const time = `${hours}:${minutes}:${secondsPart},${milliseconds}`
        return time.replace(".", ",")
    }

    function formatVRTTime(seconds: number): string {
        const date = new Date(0)
        date.setSeconds(seconds)
        const hours = String(date.getUTCHours()).padStart(2, "0")
        const minutes = String(date.getUTCMinutes()).padStart(2, "0")
        const secondsPart = String(date.getUTCSeconds()).padStart(2, "0")
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")
        let time = `${minutes}:${secondsPart}.${milliseconds}`
        if (hours !== "00") time = hours + ":" + time
        return time
    }
}

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
