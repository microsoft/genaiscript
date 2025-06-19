import { nanoid } from "nanoid";

/**
 * Generates a unique identifier.
 *
 * @returns A unique identifier string.
 */
export function generateId(): string {
  return nanoid();
}
