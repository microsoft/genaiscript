"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperAsrModel = void 0;
const serialize_error_1 = require("serialize-error");
const cancellation_js_1 = require("./cancellation.js");
const constants_js_1 = require("./constants.js");
const fetchtext_js_1 = require("./fetchtext.js");
const util_js_1 = require("./util.js");
const pretty_js_1 = require("./pretty.js");
const debug_js_1 = require("./debug.js");
const error_js_1 = require("./error.js");
const openai_chatcompletion_js_1 = require("./openai-chatcompletion.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("whisperasr");
async function WhisperASRTranscribe(req, cfg, options) {
    const { trace, cancellationToken } = options || {};
    try {
        (0, util_js_1.logVerbose)(`${cfg.provider}: transcribe ${req.file.type} ${(0, pretty_js_1.prettyBytes)(req.file.size)} with ${cfg.model}`);
        const url = new URL(`${cfg.base}/asr`);
        url.searchParams.append(`task`, req.translate ? "translate" : "transcribe");
        url.searchParams.append(`encode`, "true");
        url.searchParams.append(`output`, "json");
        if (req.language)
            url.searchParams.append(`language`, req.language);
        dbg(`url: %s`, url.toString());
        trace?.itemValue(`url`, `[${url}](${url})`);
        trace?.itemValue(`size`, req.file.size);
        trace?.itemValue(`mime`, req.file.type);
        dbg(`file: %s`, (0, pretty_js_1.prettyBytes)(req.file.size));
        const body = new FormData();
        body.append("audio_file", req.file);
        const signal = (0, cancellation_js_1.toSignal)(cancellationToken);
        const freq = {
            method: "POST",
            headers: {
                ...(0, openai_chatcompletion_js_1.getConfigHeaders)(cfg),
                Accept: "application/json",
            },
            body: body,
            signal,
        };
        (0, fetchtext_js_1.traceFetchPost)(trace, url.toString(), freq.headers, freq.body);
        // TODO: switch back to cross-fetch in the future
        const res = await global.fetch(url, freq);
        dbg(`res: %d %s`, res.status, res.statusText);
        trace?.itemValue(`status`, `${res.status} ${res.statusText}`);
        const j = await res.json();
        if (!res.ok)
            return { text: undefined, error: j?.error };
        else
            return j;
    }
    catch (e) {
        if ((0, error_js_1.isCancelError)(e))
            throw e;
        (0, util_js_1.logError)(e);
        trace?.error(e);
        return { text: undefined, error: (0, serialize_error_1.serializeError)(e) };
    }
}
exports.WhisperAsrModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_WHISPERASR,
    transcriber: WhisperASRTranscribe,
});
//# sourceMappingURL=whisperasr.js.map