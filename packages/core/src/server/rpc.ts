export class MessageQueue extends EventTarget {
    private awaiters: Record<
        string,
        { resolve: (data: any) => void; reject: (error: unknown) => void }
    > = {}
    private _nextId = 1
    private _pendingMessages: string[] = []

    constructor(
        readonly options: {
            readonly readyState: () => number
            readonly send: (msg: string) => void
        }
    ) {
        super()
    }

    flush() {
        let m: string
        while (
            this.options.readyState() === WebSocket.OPEN &&
            (m = this._pendingMessages.pop())
        )
            this.options.send(m)
    }

    async receive(data: any) {
        const req: { id: string } = data
        const { id } = req
        const awaiter = this.awaiters[id]
        if (awaiter) {
            delete this.awaiters[id]
            await awaiter.resolve(req)
            return true
        } else {
            this.dispatchEvent(new CustomEvent("message", { detail: data }))
            return false
        }
    }

    queue<T extends { id?: string }>(msg: T): Promise<T> {
        const id = msg.id ?? this._nextId++ + ""
        const mo: any = { ...msg, id }
        // avoid pollution
        delete mo.trace
        if (mo.options) delete mo.options.trace
        const m = JSON.stringify(mo)

        return new Promise<T>((resolve, reject) => {
            this.awaiters[id] = {
                resolve: (data) => resolve(data),
                reject,
            }
            if (this.options.readyState() === WebSocket.OPEN) {
                this.options.send(m)
            } else this._pendingMessages.push(m)
        })
    }

    cancel(reason?: string) {
        this._pendingMessages = []
        const cancellers = Object.values(this.awaiters)
        this.awaiters = {}
        cancellers.forEach((a) => a.reject(reason || "cancelled"))
    }
}
