// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { throttle } from "es-toolkit";
import { cleanedClone } from "../../core/src/clone";
import { QUEUE_SCRIPT_START, MESSAGE } from "../../core/src/constants";
import type {
  GenerationResult,
  PromptScriptResponseEvents,
  RequestMessages,
  LogMessageEvent,
  PromptScriptStartResponse,
} from "../../core/src/server/messages";
import { WebSocketClient } from "../../core/src/server/wsclient";
import { fetchRun } from "./api";

export class RunClient extends WebSocketClient {
  static readonly SCRIPT_START_EVENT = "scriptStart";
  static readonly SCRIPT_END_EVENT = "scriptEnd";
  static readonly PROGRESS_EVENT = "progress";
  static readonly RUN_EVENT = "run";

  runId: string;
  trace: string = "";
  output: string = "";
  reasoning: string = "";
  result: Partial<GenerationResult> = undefined;

  private progressEventThrottled = throttle(this.dispatchProgressEvent.bind(this), 2000, {
    edges: ["leading"],
  });

  private stderr = "";
  constructor(url: string) {
    super(url);
    this.addEventListener(QUEUE_SCRIPT_START, () => {
      this.updateRunId({ runId: "" });
    });
    this.stderr = "";
    this.addEventListener(
      MESSAGE,
      async (ev) => {
        const data = (ev as MessageEvent<any>).data as
          | PromptScriptResponseEvents
          | RequestMessages
          | LogMessageEvent;
        switch (data.type) {
          case "log": {
            const fn = console[data.level];
            fn?.(data.message);
            break;
          }
          case "script.progress": {
            this.updateRunId(data);
            if (data.trace) this.trace += data.trace;
            if (data.output && !data.inner) {
              this.output += data.output;
            }
            if (data.reasoning) this.reasoning += data.reasoning;
            if (data.responseChunk) {
              this.stderr += data.responseChunk;
              const lines = this.stderr.split("\n");
              for (const line of lines.slice(0, lines.length - 1)) console.debug(line);
              this.stderr = lines.at(-1);
            }
            this.progressEventThrottled();
            break;
          }
          case "script.end": {
            this.updateRunId(data);
            if (data.result) {
              this.result = cleanedClone(data.result);
            } else {
              const { result, trace } = (await fetchRun(data.runId)) || {};
              this.result = cleanedClone(result);
              this.trace = trace || "";
            }
            this.output = this.result?.text || "";
            this.reasoning = this.result?.reasoning || "";
            this.dispatchEvent(
              new CustomEvent(RunClient.SCRIPT_END_EVENT, {
                detail: this.result,
              }),
            );
            this.dispatchProgressEvent();
            break;
          }
          case "script.start":
            this.updateRunId(data.response as PromptScriptStartResponse);
            this.dispatchEvent(
              new CustomEvent(RunClient.SCRIPT_START_EVENT, {
                detail: data.response,
              }),
            );
            break;
          default: {
            console.log(data);
          }
        }
      },
      false,
    );
  }

  private dispatchProgressEvent() {
    this.dispatchEvent(new Event(RunClient.PROGRESS_EVENT));
  }

  private updateRunId(data: { runId: string }) {
    const { runId } = data;
    if (runId !== this.runId) {
      this.runId = runId;
      if (this.runId) {
        this.trace = "";
        this.output = "";
        this.result = undefined;
        this.stderr = "";
      }
      this.dispatchEvent(new Event(RunClient.RUN_EVENT));
    }
  }
}
