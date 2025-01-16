import prettyBytes from "pretty-bytes"
import { serializeError } from "serialize-error"
import { CancellationOptions } from "./cancellation"
import { CreateTranscriptionRequest, LanguageModel } from "./chat"
import { MODEL_WHISPERASR_PROVIDER } from "./constants"
import { traceFetchPost } from "./fetch"
import { getConfigHeaders } from "./openai"
import { LanguageModelConfiguration } from "./server/messages"
import { TraceOptions } from "./trace"
import { logVerbose, logError } from "./util"

async function WhisperASRTranscribe(
    req: CreateTranscriptionRequest,
    cfg: LanguageModelConfiguration,
    options: TraceOptions & CancellationOptions
): Promise<TranscriptionResult> {
    const { trace } = options || {}
    try {
        logVerbose(
            `${cfg.provider}: transcribe ${req.file.type} ${prettyBytes(req.file.size)} with ${cfg.model}`
        )
        const url = new URL(`${cfg.base}/asr`)
        url.searchParams.append(
            `task`,
            req.translate ? "translate" : "transcribe"
        )
        url.searchParams.append(`encode`, "true")
        url.searchParams.append(`output`, "json")
        if (req.language) url.searchParams.append(`language`, req.language)

        trace.itemValue(`url`, `[${url}](${url})`)
        trace.itemValue(`size`, req.file.size)
        trace.itemValue(`mime`, req.file.type)

        const body = new FormData()
        body.append("audio_file", req.file)

        const freq = {
            method: "POST",
            headers: {
                ...getConfigHeaders(cfg),
                Accept: "application/json",
            },
            body: body,
        }

        traceFetchPost(trace, url.toString(), freq.headers, freq.body)
        // TODO: switch back to cross-fetch in the future
        const res = await global.fetch(url, freq as any)
        trace.itemValue(`status`, `${res.status} ${res.statusText}`)
        const j = await res.json()
        if (!res.ok) return { text: undefined, error: j?.error }
        else return j
    } catch (e) {
        logError(e)
        trace?.error(e)
        return { text: undefined, error: serializeError(e) }
    }
}

export const WhiserAsrModel: LanguageModel = Object.freeze({
    id: MODEL_WHISPERASR_PROVIDER,
    transcriber: WhisperASRTranscribe,
} satisfies LanguageModel)
