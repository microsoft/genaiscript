import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { srtVttRender, parseTimestamps } from "./transcription"

describe("srtVttRender", () => {
    test("should render SRT and VTT correctly", () => {
        const transcription = {
            text: "",
            segments: [
                { start: 0, end: 1.5, text: "Hello world" },
                { start: 2, end: 3.5, text: "This is a test" },
            ],
        } satisfies TranscriptionResult
        const result = srtVttRender(transcription)
        assert(
            result.srt.includes(
                "1\n00:00:00,000 --> 00:00:01,500\nHello world\n"
            )
        )
        assert(
            result.srt.includes(
                "2\n00:00:02,000 --> 00:00:03,500\nThis is a test\n"
            )
        )
        assert(result.vtt.includes("00:00.000 --> 00:01.500\nHello world\n"))
        assert(result.vtt.includes("00:02.000 --> 00:03.500\nThis is a test\n"))
    })

    test("should return original transcription if no segments", () => {
        const transcription = {
            text: "",
        }
        const result = srtVttRender(transcription)
        assert.deepEqual(result, transcription)
    })
})

describe("parseTimestamps", () => {
    test("should parse timestamps correctly", () => {
        const transcription =
            "Some text [00:00:01.000] more text [00:00:02.500]"
        const result = parseTimestamps(transcription)
        assert.deepEqual(result, ["00:00:01.000", "00:00:02.500"])
    })

    test("should return empty array if no timestamps", () => {
        const transcription = "Some text without timestamps"
        const result = parseTimestamps(transcription)
        assert.deepEqual(result, [])
    })
})
