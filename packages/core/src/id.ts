import { nanoid } from 'nanoid'

/**
 * Generates a unique identifier.
 * Utilizes the nanoid library to create a random string 
 * suitable for use as a unique key or identifier.
 * 
 * @returns A unique string identifier.
 */
export function generateId(): string {
  return nanoid()
}
