import { resolveFileDataUri } from "./file"
import { TraceOptions } from "./trace"

export async function imageEncodeForLLM(
    url: string | Buffer | Blob,
    options: DefImagesOptions & TraceOptions
) {
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp")
    const { autoCrop, maxHeight, maxWidth } = options
    if (typeof url === "string") url = await resolveFileDataUri(url)
    // If the image is already a string and we don't need to do any processing, return it
    if (
        typeof url === "string" &&
        !autoCrop &&
        maxHeight === undefined &&
        maxWidth === undefined
    )
        return url

    if (url instanceof Blob) url = Buffer.from(await url.arrayBuffer())
    const img = await Jimp.read(url)
    if (autoCrop) await img.autocrop()
    if (options.maxWidth ?? options.maxHeight) {
        await img.contain({
            w: img.width > maxWidth ? maxWidth : img.width,
            h: img.height > maxHeight ? maxHeight : img.height,
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE,
        })
    }
    const outputMime = img.mime ?? ("image/jpeg" as any)
    const buf = await img.getBuffer(outputMime)
    const b64 = await buf.toString("base64")
    const imageDataUri = `data:${outputMime};base64,${b64}`
    return imageDataUri
}
