// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CLOSE, MESSAGE } from "../constants.js";
import { errorMessage } from "../error.js";
import { generateId } from "../id.js";
import { logError } from "../util.js";
import { WebSocketClient } from "./wsclient.js";
export class VsCodeClient extends WebSocketClient {
    url;
    externalUrl;
    cspUrl;
    chatRequest;
    runs = {};
    constructor(url, externalUrl, cspUrl) {
        super(url);
        this.url = url;
        this.externalUrl = externalUrl;
        this.cspUrl = cspUrl;
        this.configure();
    }
    installPolyfill() {
        if (typeof WebSocket === "undefined") {
            try {
                require("websocket-polyfill");
            }
            catch (err) {
                logError("websocket polyfill failed");
                logError(err);
            }
        }
    }
    configure() {
        this.installPolyfill();
        this.addEventListener(CLOSE, (e) => {
            const reason = e.reason || "websocket closed";
            for (const [runId, run] of Object.entries(this.runs)) {
                run.reject(reason);
                delete this.runs[runId];
            }
        });
        this.addEventListener(MESSAGE, async (e) => {
            const event = e;
            // handle run progress
            const ev = event.data;
            const { runId, type } = ev;
            const run = this.runs[runId];
            if (run) {
                switch (type) {
                    case "script.progress": {
                        if (ev.trace && run.trace)
                            run.trace.appendContent(ev.trace);
                        if (ev.progress && !ev.inner)
                            run.infoCb({ text: ev.progress });
                        if (ev.response || ev.tokens !== undefined)
                            run.partialCb({
                                responseChunk: ev.responseChunk,
                                responseSoFar: ev.response,
                                reasoningSoFar: ev.reasoning,
                                tokensSoFar: ev.tokens,
                                inner: ev.inner,
                            });
                        break;
                    }
                    case "script.end": {
                        const run = this.runs[runId];
                        delete this.runs[runId];
                        if (run) {
                            const res = structuredClone(ev.result);
                            if (res?.text)
                                run.infoCb(res);
                            run.resolve(res);
                        }
                        break;
                    }
                }
            }
            else {
                const cev = event.data;
                const { chatId, type } = cev;
                switch (type) {
                    case "chat.start": {
                        if (!this.chatRequest)
                            throw new Error("GitHub Copilot Chat Models not supported");
                        await this.chatRequest(cev, (chunk) => {
                            this.queue({
                                ...chunk,
                                chatId,
                                type: "chat.chunk",
                            });
                        });
                        // done
                    }
                }
            }
        });
    }
    async runScript(script, files, options) {
        const runId = generateId();
        const { signal, infoCb, partialCb, trace, ...optionsRest } = options;
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        this.runs[runId] = {
            script,
            files,
            options,
            trace,
            infoCb,
            partialCb,
            promise,
            resolve,
            reject,
            signal,
        };
        signal?.addEventListener("abort", (ev) => {
            this.abortScript(runId, "user aborted");
        });
        const res = await this.queue({
            type: "script.start",
            runId,
            script,
            files,
            options: optionsRest,
        });
        if (!res.response?.ok) {
            delete this.runs[runId]; // failed to start
            throw new Error(errorMessage(res.response?.error) ?? "failed to start script");
        }
        return { runId, request: promise };
    }
    abortScriptRuns(reason) {
        for (const runId of Object.keys(this.runs)) {
            this.abortScript(runId, reason);
            delete this.runs[runId];
        }
    }
    async runTest(script, options) {
        const res = await this.queue({
            type: "tests.run",
            scripts: script?.id ? [script?.id] : undefined,
            options,
        });
        return res.response;
    }
}
//# sourceMappingURL=client.js.map