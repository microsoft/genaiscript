/**
 * GenAIScript supporting runtime
 */
import { delay as esDelay } from "es-toolkit"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = esDelay
