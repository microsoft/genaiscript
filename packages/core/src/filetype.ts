export async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
    const { fileTypeFromBuffer } = await import("file-type")
    return fileTypeFromBuffer(buffer)
}
