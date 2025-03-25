/**
* """
* Asserts that a given condition is true. If the condition is false, logs an error message and throws an exception. Optionally supports additional debug data for logging.
* 
* Parameters:
* - cond: A boolean condition to evaluate.
* - msg: An optional message to display if the assertion fails.
* - debugData: Optional extra data for debugging output when the assertion fails.
* 
* Throws:
* - Error with the provided message if the condition is false.
* """
*/
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
