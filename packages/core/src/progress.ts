/**
 * Defines a generalized way of reporting progress updates.
 */
export interface Progress {
    /**
     * Report a progress update.
     * @param value A progress item, like a message and/or an
     * report on how much work finished
     */
    report(value: {
        message?: string
        increment?: number
    }): void
}
