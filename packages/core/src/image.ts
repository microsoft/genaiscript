export async function imageEncodeForLLM(
    url: string | Buffer | Blob,
    options: {
        autocrop?: boolean
        maxWidth?: number
        maxHeight?: number
        mime?: "image/jpeg" | "image/png"
    }
) {
    const { Jimp, ResizeStrategy } = await import("jimp")
    const { autocrop, maxHeight, maxWidth, mime } = options
    if (url instanceof Blob) url = Buffer.from(await url.arrayBuffer())
    const img = await Jimp.read(url)
    if (autocrop) await img.autocrop()
    if (options.maxWidth ?? options.maxHeight) {
        await img.scaleToFit({
            w: maxWidth,
            h: maxHeight,
        })
    }
    const outputMime = mime ?? img.mime ?? ("image/jpeg" as any)
    const buf = await img.getBuffer(outputMime)
    const b64 = await buf.toString("base64")
    const imageDataUri = `data:${outputMime};base64,${b64}`
    return imageDataUri
}
