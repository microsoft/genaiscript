import { deleteEmptyValues } from "./cleaners"

export function cleanedClone(o: any) {
    const c = structuredClone(o)
    deleteEmptyValues(c)
    return c
}
