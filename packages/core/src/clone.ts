import { deleteEmptyValues } from "./cleaners"

/**
 * Creates a deep clone of the given object and removes empty values.
 *
 * This function first performs a structured clone of the input object
 * to ensure that all nested properties are copied. After cloning, it 
 * invokes the `deleteEmptyValues` function to eliminate any properties 
 * that are considered empty.
 *
 * @param o - The object to be cloned and cleaned.
 * @returns A cleaned clone of the input object with empty values removed.
 */
export function cleanedClone(o: any) {
    const c = structuredClone(o)
    deleteEmptyValues(c)
    return c
}
