import { AbortSignalCancellationController } from "../../core/src/cancellation";
import { logWarn } from "../../core/src/util";

/**
 * Creates and returns an instance of AbortSignalCancellationController for handling cancellations.
 *
 * This function sets up a signal handler for SIGINT. On receiving the signal, it logs a warning,
 * aborts the cancellation controller, and removes the signal handler. Calling SIGINT again after
 * the first cancellation is invoked will exit the process.
 *
 * @returns An initialized AbortSignalCancellationController instance.
 */
export function createCancellationController() {
  const canceller = new AbortSignalCancellationController();
  const cancelHandler = () => {
    logWarn("cancelling (cancel again to exit)...");
    canceller.abort();
    process.off("SIGINT", cancelHandler);
  };
  process.on("SIGINT", cancelHandler);
  return canceller;
}
