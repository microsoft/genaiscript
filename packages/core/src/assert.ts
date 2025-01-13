export function assert(
    cond: boolean,
    msg = "Assertion failed",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debugData?: any
) {
    if (!cond) {
        if (debugData) console.error(msg || `assertion failed`, debugData)
        // eslint-disable-next-line no-debugger
        debugger
        throw new Error(msg)
    }
}
