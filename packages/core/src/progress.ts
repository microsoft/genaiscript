/**
 * Defines a generalized way of reporting progress updates.
 */
export abstract class Progress {
    abstract report(value: {
        message?: string
        count?: number
        succeeded?: boolean | undefined
    }): void

    start(message: string, count?: number) {
        this.report({ message, count })
    }

    succeed(message?: string) {
        this.report({ message: message || "", succeeded: true })
    }

    fail(message?: string) {
        this.report({ message: message || "", succeeded: false })
    }

    stop() {}
}
