// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { serializeError } from "serialize-error";
import { CancellationOptions, toSignal } from "./cancellation.js";
import { CreateTranscriptionRequest, LanguageModel } from "./chat.js";
import { MODEL_PROVIDER_WHISPERASR } from "./constants.js";
import { traceFetchPost } from "./fetchtext.js";
import { getConfigHeaders } from "./openai.js";
import { LanguageModelConfiguration } from "./server/messages.js";
import { TraceOptions } from "./trace.js";
import { logVerbose, logError } from "./util.js";
import { prettyBytes } from "./pretty.js";
import { genaiscriptDebug } from "./debug.js";
import { isCancelError } from "./error.js";
const dbg = genaiscriptDebug("whisperasr");

async function WhisperASRTranscribe(
  req: CreateTranscriptionRequest,
  cfg: LanguageModelConfiguration,
  options: TraceOptions & CancellationOptions,
): Promise<TranscriptionResult> {
  const { trace, cancellationToken } = options || {};
  try {
    logVerbose(
      `${cfg.provider}: transcribe ${req.file.type} ${prettyBytes(req.file.size)} with ${cfg.model}`,
    );
    const url = new URL(`${cfg.base}/asr`);
    url.searchParams.append(`task`, req.translate ? "translate" : "transcribe");
    url.searchParams.append(`encode`, "true");
    url.searchParams.append(`output`, "json");
    if (req.language) url.searchParams.append(`language`, req.language);
    dbg(`url: %s`, url.toString());

    trace.itemValue(`url`, `[${url}](${url})`);
    trace.itemValue(`size`, req.file.size);
    trace.itemValue(`mime`, req.file.type);

    dbg(`file: %s`, prettyBytes(req.file.size));

    const body = new FormData();
    body.append("audio_file", req.file);

    const signal = toSignal(cancellationToken);
    const freq = {
      method: "POST",
      headers: {
        ...getConfigHeaders(cfg),
        Accept: "application/json",
      },
      body: body,
      signal,
    };

    traceFetchPost(trace, url.toString(), freq.headers, freq.body);
    // TODO: switch back to cross-fetch in the future
    const res = await global.fetch(url, freq as any);
    dbg(`res: %d %s`, res.status, res.statusText);
    trace.itemValue(`status`, `${res.status} ${res.statusText}`);
    const j = await res.json();
    if (!res.ok) return { text: undefined, error: j?.error };
    else return j;
  } catch (e) {
    if (isCancelError(e)) throw e;
    logError(e);
    trace?.error(e);
    return { text: undefined, error: serializeError(e) };
  }
}

export const WhisperAsrModel: LanguageModel = Object.freeze({
  id: MODEL_PROVIDER_WHISPERASR,
  transcriber: WhisperASRTranscribe,
} satisfies LanguageModel);
