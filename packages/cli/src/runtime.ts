/**
 * GenAIScript supporting runtime
 */
import { delay as _delay } from "es-toolkit"
import { z as zod } from "zod"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = _delay

/**
 * Zod schema generator
 */
export const z = zod
