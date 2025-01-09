/**
 * GenAIScript supporting runtime
 */
import { delay as _delay } from "es-toolkit"
import { z as _z } from "zod"
import { pipeline as _pipeline } from "@huggingface/transformers"

/**
 * A helper function to delay the execution of the script
 */
export const delay: (ms: number) => Promise<void> = _delay

/**
 * Zod schema generator
 */
export const z = _z

/**
 * HuggingFace transformers.js pipeline apis.
 */
export const pipeline = _pipeline
