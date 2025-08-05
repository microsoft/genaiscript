// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CHANGE, CLIENT_RECONNECT_DELAY, CLOSE, CONNECT, ERROR, MESSAGE, OPEN, QUEUE_SCRIPT_START, RECONNECT, } from "../constants.js";
export class WebSocketClient extends EventTarget {
    url;
    awaiters = {};
    _nextId = 1;
    _ws;
    _pendingMessages = [];
    _reconnectTimeout;
    _error;
    connectedOnce = false;
    reconnectAttempts = 0;
    constructor(url) {
        super();
        this.url = url;
    }
    dispatchChange() {
        this.dispatchEvent(new Event(CHANGE));
    }
    async init() {
        if (this._ws)
            return Promise.resolve(undefined);
        this.connect();
    }
    get readyState() {
        const states = ["connecting", "open", "closing", "closed", "error"];
        if (this._error)
            return "error";
        return states[this._ws?.readyState] || "closed";
    }
    get error() {
        return this._error;
    }
    reconnect() {
        this.reconnectAttempts++;
        this.dispatchEvent(new Event(RECONNECT));
        this._ws = undefined;
        clearTimeout(this._reconnectTimeout);
        this._reconnectTimeout = setTimeout(() => {
            try {
                this.connect();
            }
            catch (e) {
                this._error = e;
                this.dispatchChange();
            }
        }, CLIENT_RECONNECT_DELAY);
    }
    connect() {
        this._error = undefined;
        this._ws = new WebSocket(this.url);
        this._ws.addEventListener(OPEN, () => {
            // clear counter
            this.connectedOnce = true;
            this.reconnectAttempts = 0;
            // flush cached messages
            let m;
            while (this._ws?.readyState === WebSocket.OPEN && (m = this._pendingMessages.pop()))
                this._ws.send(m);
            this.dispatchEvent(new Event(OPEN));
            this.dispatchChange();
        }, false);
        this._ws.addEventListener(ERROR, (ev) => {
            this.reconnect();
            this.dispatchChange();
        }, false);
        this._ws.addEventListener(CLOSE, 
        // CloseEvent not defined in electron
        (ev) => {
            const reason = ev.reason || "websocket closed";
            this.cancel(reason);
            this.dispatchEvent(new Event(CLOSE));
            this.dispatchChange();
            this.reconnect();
        }, false);
        this._ws.addEventListener(MESSAGE, (async (e) => {
            const event = e;
            const data = JSON.parse(event.data);
            // handle responses
            const req = data;
            const { id } = req;
            const awaiter = this.awaiters[id];
            if (awaiter) {
                delete this.awaiters[id];
                await awaiter.resolve(req);
            }
            // not a response
            this.dispatchEvent(new MessageEvent(MESSAGE, {
                data,
            }));
        }), false);
        this.dispatchEvent(new Event(CONNECT));
    }
    queue(msg, options) {
        const { reuse } = options || {};
        if (reuse) {
            const awaiter = Object.values(this.awaiters).find((a) => a.msg.type === msg.type);
            if (awaiter?.promise) {
                return awaiter.promise;
            }
        }
        const id = this._nextId++ + "";
        const mo = { ...msg, id };
        // avoid pollution
        delete mo.trace;
        if (mo.options)
            delete mo.options.trace;
        const m = JSON.stringify(mo);
        this.init();
        let awaiter;
        const p = new Promise((resolve, reject) => {
            awaiter = this.awaiters[id] = {
                msg,
                resolve: (data) => resolve(data),
                reject,
            };
            if (this._ws?.readyState === WebSocket.OPEN) {
                this._ws.send(m);
            }
            else
                this._pendingMessages.push(m);
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
                }
                finally {
                }
        }
        this.cancel();
    }
    cancel(reason) {
        this.reconnectAttempts = 0;
        this._pendingMessages = [];
        const cancellers = Object.values(this.awaiters);
        this.awaiters = {};
        cancellers.forEach((a) => a.reject(reason || "cancelled"));
    }
    kill() {
        if (typeof WebSocket !== "undefined" && this._ws?.readyState === WebSocket.OPEN)
            this._ws.send(JSON.stringify({ type: "server.kill", id: this._nextId++ + "" }));
        this.stop();
    }
    dispose() {
        this.kill();
        return undefined;
    }
    async getLanguageModelConfiguration(modelId, options) {
        const res = await this.queue({
            type: "model.configuration",
            model: modelId,
            token: options?.token,
        }, { reuse: true });
        return res.response?.ok ? res.response.info : undefined;
    }
    async version() {
        const res = await this.queue({ type: "server.version" }, { reuse: true });
        return res.response;
    }
    async infoEnv() {
        const res = await this.queue({ type: "server.env" }, { reuse: true });
        return res.response;
    }
    async listScripts() {
        const res = await this.queue({ type: "script.list" }, { reuse: true });
        const project = res.response?.project;
        return project;
    }
    async startScript(runId, script, files, options) {
        this.dispatchEvent(new Event(QUEUE_SCRIPT_START));
        return this.queue({
            type: "script.start",
            runId,
            script,
            files,
            options,
        });
    }
    async abortScript(runId, reason) {
        if (!runId)
            return { ok: true };
        const res = await this.queue({
            type: "script.abort",
            runId,
            reason,
        });
        return res.response;
    }
}
//# sourceMappingURL=wsclient.js.map