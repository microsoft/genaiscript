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
import { deleteUndefinedValues } from "./cleaners"

async function prepare(
    url: BufferLike,
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
    logVerbose(
        `image: encoding ${prettyBytes(buffer.length)} with ${Object.entries(
            deleteUndefinedValues({
                autoCrop,
                maxHeight,
                maxWidth,
                scale,
                rotate,
                greyscale,
                crop,
                flip,
                detail,
            })
        )
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(", ")}`
    )

    // Read the image using Jimp
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp")
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

    if (flip) img.flip(flip)

    // Contain the image within specified max dimensions if provided
    if (options.maxWidth ?? options.maxHeight) {
        img.contain({
            w: img.width > maxWidth ? maxWidth : img.width, // Determine target width
            h: img.height > maxHeight ? maxHeight : img.height, // Determine target height
            align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE, // Center alignment
        })
    }

    if (greyscale) img.greyscale()

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
    } else
        contain(
            img,
            IMAGE_DETAIL_HIGH_WIDTH,
            IMAGE_DETAIL_HIGH_HEIGHT,
            HorizontalAlign.CENTER | VerticalAlign.MIDDLE
        )
    return img
}

function contain(
    img: {
        width: number
        height: number
        contain: (arg0: { w: number; h: number; align: number }) => void
    },
    width: number,
    height: number,
    align: number
) {
    if (img.width > width || img.height > height) {
        img.contain({
            w: Math.min(img.width, width),
            h: Math.min(img.height, height),
            align,
        })
    }
}

async function encode(
    img: {
        mime?: string
        width: number
        height: number
        getBuffer(mime: string): Promise<Buffer>
    },
    options: DefImagesOptions & TraceOptions
) {
    // Determine the output MIME type, defaulting to image/jpeg
    const { detail } = options
    const outputMime = img.mime || ("image/jpeg" as any)
    const buf = await img.getBuffer(outputMime)
    const b64 = buf.toString("base64")
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

/**
 * Asynchronously encodes an image for use in LLMs (Language Learning Models).
 *
 * @param url - The source of the image, which can be a URL string, Buffer, or Blob.
 * @param options - Configuration options that include image definitions and trace options.
 * @returns A promise that resolves to an image encoded as a data URI.
 */
export async function imageEncodeForLLM(
    url: BufferLike,
    options: DefImagesOptions & TraceOptions
) {
    const img = await prepare(url, options)
    return await encode(img, options)
}

export async function imageTileEncodeForLLM(
    urls: BufferLike[],
    options: DefImagesOptions & TraceOptions
) {
    logVerbose(`image: tiling ${urls.length} images`)
    const imgs = await Promise.all(urls.map((url) => prepare(url, options)))

    const imgw = imgs.reduce((acc, img) => Math.max(acc, img.width), 0)
    const imgh = imgs.reduce((acc, img) => Math.max(acc, img.height), 0)
    const ncols = Math.ceil(Math.sqrt(imgs.length))
    const nrows = Math.ceil(imgs.length / ncols)
    const width = ncols * imgw
    const height = nrows * imgh

    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp")
    const canvas = new Jimp({ width, height })

    for (let i = 0; i < imgs.length; i++) {
        const ci = Math.floor(i / nrows)
        const ri = i % nrows
        const x = ci * imgw
        const y = ri * imgh
        canvas.composite(imgs[i], x, y)
    }

    contain(
        canvas,
        IMAGE_DETAIL_HIGH_WIDTH,
        IMAGE_DETAIL_HIGH_HEIGHT,
        HorizontalAlign.CENTER | VerticalAlign.MIDDLE
    )

    return await encode(canvas, { ...options, detail: undefined })
}
