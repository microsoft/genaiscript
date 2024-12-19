import { AbortSignalCancellationController } from "../../core/src/cancellation"
import { logWarn } from "../../core/src/util"

export function createCancellationController() {
    const canceller = new AbortSignalCancellationController()
    const cancelHandler = () => {
        logWarn("cancelling (cancel again to exit)...")
        canceller.abort()
        process.off("SIGINT", cancelHandler)
    }
    process.on("SIGINT", cancelHandler)
    return canceller
}
