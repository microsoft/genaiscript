export async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
    if (buffer === undefined) return undefined

    const { fileTypeFromBuffer } = await import("file-type")
    return fileTypeFromBuffer(buffer)
}
