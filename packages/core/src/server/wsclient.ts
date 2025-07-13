// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  CHANGE,
  CLIENT_RECONNECT_DELAY,
  CLOSE,
  CONNECT,
  ERROR,
  MESSAGE,
  OPEN,
  QUEUE_SCRIPT_START,
  RECONNECT,
} from "../constants.js";
import type {
  ChatEvents,
  LanguageModelConfiguration,
  LanguageModelConfigurationRequest,
  LogMessageEvent,
  Project,
  PromptScriptAbort,
  PromptScriptList,
  PromptScriptListResponse,
  PromptScriptResponseEvents,
  PromptScriptRunOptions,
  PromptScriptStart,
  RequestMessage,
  ResponseStatus,
  ServerEnv,
  ServerEnvResponse,
  ServerResponse,
  ServerVersion,
} from "./messages.js";

interface Awaiter {
  msg: Omit<RequestMessage, "id">;
  promise?: Promise<any>;
  resolve: (data: any) => void;
  reject: (error: unknown) => void;
}

export class WebSocketClient extends EventTarget {
  private awaiters: Record<string, Awaiter> = {};
  private _nextId = 1;
  private _ws: WebSocket;
  private _pendingMessages: string[] = [];
  private _reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
  private _error: unknown | undefined;
  connectedOnce = false;
  reconnectAttempts = 0;

  constructor(readonly url: string) {
    super();
  }

  private dispatchChange() {
    this.dispatchEvent(new Event(CHANGE));
  }

  async init(): Promise<void> {
    if (this._ws) return Promise.resolve(undefined);
    this.connect();
  }

  get readyState(): "connecting" | "open" | "closing" | "closed" | "error" {
    const states = ["connecting", "open", "closing", "closed", "error"];
    if (this._error) return "error";
    return (states[this._ws?.readyState] as any) || "closed";
  }

  get error() {
    return this._error;
  }

  private reconnect() {
    this.reconnectAttempts++;
    this.dispatchEvent(new Event(RECONNECT));
    this._ws = undefined;
    clearTimeout(this._reconnectTimeout);
    this._reconnectTimeout = setTimeout(() => {
      try {
        this.connect();
      } catch (e) {
        this._error = e;
        this.dispatchChange();
      }
    }, CLIENT_RECONNECT_DELAY);
  }

  private connect(): void {
    this._error = undefined;
    this._ws = new WebSocket(this.url);
    this._ws.addEventListener(
      OPEN,
      () => {
        // clear counter
        this.connectedOnce = true;
        this.reconnectAttempts = 0;
        // flush cached messages
        let m: string;
        while (this._ws?.readyState === WebSocket.OPEN && (m = this._pendingMessages.pop()))
          this._ws.send(m);
        this.dispatchEvent(new Event(OPEN));
        this.dispatchChange();
      },
      false,
    );
    this._ws.addEventListener(
      ERROR,
      (ev) => {
        this.reconnect();
        this.dispatchChange();
      },
      false,
    );
    this._ws.addEventListener(
      CLOSE,
      // CloseEvent not defined in electron
      (ev: Event) => {
        const reason = (ev as any).reason || "websocket closed";
        this.cancel(reason);
        this.dispatchEvent(new Event(CLOSE));
        this.dispatchChange();
        this.reconnect();
      },
      false,
    );
    this._ws.addEventListener(
      MESSAGE,
      <(event: MessageEvent<any>) => void>(async (e) => {
        const event = e as MessageEvent<any>;
        const data = JSON.parse(event.data);
        // handle responses
        const req: { id: string } = data;
        const { id } = req;
        const awaiter = this.awaiters[id];
        if (awaiter) {
          delete this.awaiters[id];
          await awaiter.resolve(req);
        }
        // not a response
        this.dispatchEvent(
          new MessageEvent<PromptScriptResponseEvents | ChatEvents | LogMessageEvent>(MESSAGE, {
            data,
          }),
        );
      }),
      false,
    );
    this.dispatchEvent(new Event(CONNECT));
  }

  queue<T extends RequestMessage>(msg: Omit<T, "id">, options?: { reuse: boolean }): Promise<T> {
    const { reuse } = options || {};
    if (reuse) {
      const awaiter = Object.values(this.awaiters).find((a) => a.msg.type === msg.type);
      if (awaiter?.promise) {
        return awaiter.promise;
      }
    }

    const id = this._nextId++ + "";
    const mo: any = { ...msg, id };
    // avoid pollution
    delete mo.trace;
    if (mo.options) delete mo.options.trace;
    const m = JSON.stringify(mo);

    this.init();
    let awaiter: Awaiter;
    const p = new Promise<T>((resolve, reject) => {
      awaiter = this.awaiters[id] = {
        msg,
        resolve: (data) => resolve(data),
        reject,
      } satisfies Awaiter;
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(m);
      } else this._pendingMessages.push(m);
    });
    awaiter.promise = p;
    return p;
  }

  get pending() {
    return this._pendingMessages?.length > 0;
  }

  stop() {
    this.reconnectAttempts = 0;
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = undefined;
    }
    if (this._ws) {
      const ws = this._ws;
      this._ws = undefined;
      if (ws.readyState !== WebSocket.CLOSED)
        try {
          ws.close();
        } finally {
        }
    }
    this.cancel();
  }

  cancel(reason?: string) {
    this.reconnectAttempts = 0;
    this._pendingMessages = [];
    const cancellers = Object.values(this.awaiters);
    this.awaiters = {};
    cancellers.forEach((a) => a.reject(reason || "cancelled"));
  }

  kill(): void {
    if (typeof WebSocket !== "undefined" && this._ws?.readyState === WebSocket.OPEN)
      this._ws.send(JSON.stringify({ type: "server.kill", id: this._nextId++ + "" }));
    this.stop();
  }

  dispose(): any {
    this.kill();
    return undefined;
  }

  async getLanguageModelConfiguration(
    modelId: string,
    options?: { token?: boolean },
  ): Promise<LanguageModelConfiguration | undefined> {
    const res = await this.queue<LanguageModelConfigurationRequest>(
      {
        type: "model.configuration",
        model: modelId,
        token: options?.token,
      },
      { reuse: true },
    );
    return res.response?.ok ? res.response.info : undefined;
  }

  async version(): Promise<ServerResponse> {
    const res = await this.queue<ServerVersion>({ type: "server.version" }, { reuse: true });
    return res.response as ServerResponse;
  }

  async infoEnv(): Promise<ServerEnvResponse> {
    const res = await this.queue<ServerEnv>({ type: "server.env" }, { reuse: true });
    return res.response as ServerEnvResponse;
  }

  async listScripts(): Promise<Project> {
    const res = await this.queue<PromptScriptList>({ type: "script.list" }, { reuse: true });
    const project = (res.response as PromptScriptListResponse)?.project;
    return project;
  }

  async startScript(
    runId: string,
    script: string,
    files: string[],
    options: Partial<PromptScriptRunOptions>,
  ) {
    this.dispatchEvent(new Event(QUEUE_SCRIPT_START));
    return this.queue<PromptScriptStart>({
      type: "script.start",
      runId,
      script,
      files,
      options,
    });
  }

  async abortScript(runId: string, reason: string): Promise<ResponseStatus> {
    if (!runId) return { ok: true };
    const res = await this.queue<PromptScriptAbort>({
      type: "script.abort",
      runId,
      reason,
    });
    return res.response;
  }
}
