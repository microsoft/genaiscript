// Import necessary functions and types from other modules
import { resolveFileDataUri } from "./file"
import { TraceOptions } from "./trace"

/**
 * Asynchronously encodes an image for use in LLMs (Language Learning Models).
 *
 * @param url - The source of the image, which can be a URL string, Buffer, or Blob.
 * @param options - Configuration options that include image definitions and trace options.
 * @returns A promise that resolves to an image encoded as a data URI.
 */
export async function imageEncodeForLLM(
    url: string | Buffer | Blob,
    options: DefImagesOptions & TraceOptions
) {
    // Dynamically import the Jimp library and its alignment enums
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp")
    let { autoCrop, maxHeight, maxWidth } = options

    // If the URL is a string, resolve it to a data URI
    if (typeof url === "string") url = await resolveFileDataUri(url)

    // https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images

    // Return the URL if no image processing is required
    if (
        typeof url === "string" &&
        !autoCrop &&
        maxHeight === undefined &&
        maxWidth === undefined
    )
        return url

    // Convert Blob to Buffer if necessary
    if (url instanceof Blob) url = Buffer.from(await url.arrayBuffer())

    // Read the image using Jimp
    const img = await Jimp.read(url)

    // Auto-crop the image if required by options
    if (autoCrop) await img.autocrop()

    // Contain the image within specified max dimensions if provided
    if (options.maxWidth ?? options.maxHeight) {
        await img.contain({
            w: img.width > maxWidth ? maxWidth : img.width, // Determine target width
            h: img.height > maxHeight ? maxHeight : img.height, // Determine target height
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE, // Center alignment
        })
    }

    // Determine the output MIME type, defaulting to image/jpeg
    const outputMime = img.mime ?? ("image/jpeg" as any)

    // Convert the processed image to a Buffer
    const buf = await img.getBuffer(outputMime)

    // Convert the Buffer to a Base64 string
    const b64 = await buf.toString("base64")

    // Construct the data URI from the Base64 string
    const imageDataUri = `data:${outputMime};base64,${b64}`

    // Return the encoded image data URI
    return imageDataUri
}
