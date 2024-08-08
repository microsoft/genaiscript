import { toHex } from "./util"

export function randomHex(size: number) {
    const bytes = new Uint8Array(size)
    crypto.getRandomValues(bytes)
    return toHex(bytes)
}