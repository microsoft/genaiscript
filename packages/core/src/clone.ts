import { deleteEmptyValues } from "./cleaners";

/**
 * Creates a deep clone of the input object and removes any properties with empty values.
 *
 * @param o - The object to be cloned and cleaned.
 * @returns A cleaned, deep-cloned version of the input object with empty values removed.
 */
export function cleanedClone(o: any) {
  const c = structuredClone(o);
  deleteEmptyValues(c);
  return c;
}
