// Import necessary functions and types from other modules
import prettyBytes from "pretty-bytes"
import { resolveBufferLike } from "./bufferlike"
import {
    IMAGE_DETAIL_HIGH_HEIGHT,
    IMAGE_DETAIL_HIGH_WIDTH,
    IMAGE_DETAIL_LOW_HEIGHT,
    IMAGE_DETAIL_LOW_WIDTH,
} from "./constants"
import { TraceOptions } from "./trace"
import { logVerbose } from "./util"

/**
 * Asynchronously encodes an image for use in LLMs (Language Learning Models).
 *
 * @param url - The source of the image, which can be a URL string, Buffer, or Blob.
 * @param options - Configuration options that include image definitions and trace options.
 * @returns A promise that resolves to an image encoded as a data URI.
 */
export async function imageEncodeForLLM(
    url: string | Buffer | Blob | ReadableStream,
    options: DefImagesOptions & TraceOptions
) {
    // Dynamically import the Jimp library and its alignment enums
    let {
        autoCrop,
        maxHeight,
        maxWidth,
        scale,
        rotate,
        greyscale,
        crop,
        flip,
        detail,
    } = options

    // https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images
    // If the URL is a string, resolve it to a data URI
    const buffer = await resolveBufferLike(url)
    logVerbose(`image: encoding ${prettyBytes(buffer.length)}`)
    // Read the image using Jimp
    const { Jimp, HorizontalAlign, VerticalAlign, ResizeStrategy } =
        await import("jimp")
    const img = await Jimp.read(buffer)
    const { width, height } = img
    if (crop) {
        const x = Math.max(0, Math.min(width, crop.x ?? 0))
        const y = Math.max(0, Math.min(height, crop.y ?? 0))
        const w = Math.max(1, Math.min(width - x, crop.w ?? width))
        const h = Math.max(1, Math.min(height - y, crop.h ?? height))
        img.crop({ x, y, w, h })
    }

    // Auto-crop the image if required by options
    if (autoCrop) img.autocrop()

    if (!isNaN(scale)) img.scale(scale)

    if (!isNaN(rotate)) img.rotate(rotate)

    // Contain the image within specified max dimensions if provided
    if (options.maxWidth ?? options.maxHeight) {
        img.contain({
            w: img.width > maxWidth ? maxWidth : img.width, // Determine target width
            h: img.height > maxHeight ? maxHeight : img.height, // Determine target height
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE, // Center alignment
        })
    }

    if (greyscale) img.greyscale()

    if (flip) img.flip(flip)

    // https://platform.openai.com/docs/guides/vision/low-or-high-fidelity-image-understanding#low-or-high-fidelity-image-understanding
    if (
        detail === "low" &&
        (img.width > IMAGE_DETAIL_LOW_WIDTH ||
            img.height > IMAGE_DETAIL_LOW_HEIGHT)
    ) {
        img.contain({
            w: Math.min(img.width, IMAGE_DETAIL_LOW_WIDTH),
            h: Math.min(img.height, IMAGE_DETAIL_LOW_HEIGHT),
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE,
        })
    } else if (
        img.width > IMAGE_DETAIL_HIGH_WIDTH ||
        img.height > IMAGE_DETAIL_HIGH_HEIGHT
    ) {
        img.contain({
            w: Math.min(img.width, IMAGE_DETAIL_HIGH_WIDTH),
            h: Math.min(img.height, IMAGE_DETAIL_HIGH_HEIGHT),
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE,
        })
    }

    // Determine the output MIME type, defaulting to image/jpeg
    const outputMime = img.mime ?? ("image/jpeg" as any)

    // Convert the processed image to a Buffer
    const buf = await img.getBuffer(outputMime)

    // Convert the Buffer to a Base64 string
    const b64 = buf.toString("base64")

    // Construct the data URI from the Base64 string
    const imageDataUri = `data:${outputMime};base64,${b64}`

    // Return the encoded image data URI
    return {
        width: img.width,
        height: img.height,
        type: outputMime,
        url: imageDataUri,
        detail,
    }
}
