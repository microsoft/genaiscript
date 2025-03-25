import debug from "debug"
const dbg = debug("genaiscript:image")

// Import necessary functions and types from other modules
import { resolveBufferLike } from "./bufferlike"
import {
    CONSOLE_COLOR_DEBUG,
    IMAGE_DETAIL_HIGH_HEIGHT,
    IMAGE_DETAIL_HIGH_WIDTH,
    IMAGE_DETAIL_LOW_HEIGHT,
    IMAGE_DETAIL_LOW_WIDTH,
} from "./constants"
import { TraceOptions } from "./trace"
import { ellipse, logVerbose } from "./util"
import pLimit from "p-limit"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { wrapColor, wrapRgbColor } from "./consolecolor"
import { assert } from "console"

async function prepare(
    url: BufferLike,
    options: ImageGenerationOptions &
        TraceOptions &
        CancellationOptions & { detail?: "high" | "low" | "original" }
) {
    // Dynamically import the Jimp library and its alignment enums
    let {
        cancellationToken,
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
    checkCancelled(cancellationToken)

    dbg(`loading image`)
    // https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images
    // If the URL is a string, resolve it to a data URI
    const buffer = await resolveBufferLike(url)
    checkCancelled(cancellationToken)

    // Read the image using Jimp
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp")
    const img = await Jimp.read(buffer)
    checkCancelled(cancellationToken)
    const { width, height } = img
    if (crop) {
        dbg(`cropping image with provided dimensions`)
        const x = Math.max(0, Math.min(width, crop.x ?? 0))
        const y = Math.max(0, Math.min(height, crop.y ?? 0))
        const w = Math.max(1, Math.min(width - x, crop.w ?? width))
        const h = Math.max(1, Math.min(height - y, crop.h ?? height))
        img.crop({ x, y, w, h })
    }

    if (!isNaN(scale)) {
        dbg(`scaling image by factor ${scale}`)
        img.scale(scale)
    }

    if (!isNaN(rotate)) {
        dbg(`rotating image by ${rotate} degrees`)
        img.rotate(rotate)
    }

    if (flip) {
        dbg(`flipping image`, flip)
        img.flip(flip)
    }

    // Contain the image within specified max dimensions if provided
    if (options.maxWidth ?? options.maxHeight) {
        dbg(
            `containing image within ${options.maxWidth || ""}x${options.maxHeight || ""}`
        )
        contain(
            img,
            img.width > maxWidth ? maxWidth : img.width,
            img.height > maxHeight ? maxHeight : img.height,
            HorizontalAlign.CENTER | VerticalAlign.MIDDLE
        )
    }

    // Auto-crop the image if required by options
    if (autoCrop) {
        dbg(`auto-cropping image`)
        img.autocrop()
    }

    if (greyscale) {
        dbg(`applying greyscale to image`)
        img.greyscale()
    }

    checkCancelled(cancellationToken)

    // https://platform.openai.com/docs/guides/vision/low-or-high-fidelity-image-understanding#low-or-high-fidelity-image-understanding
    if (detail === "low") {
        dbg(`setting image detail to low`)
        contain(
            img,
            Math.min(img.width, IMAGE_DETAIL_LOW_WIDTH),
            Math.min(img.height, IMAGE_DETAIL_LOW_HEIGHT),
            HorizontalAlign.CENTER | VerticalAlign.MIDDLE
        )
    } else if (detail !== "original") {
        dbg(`setting image detail to low`)
        contain(
            img,
            IMAGE_DETAIL_HIGH_WIDTH,
            IMAGE_DETAIL_HIGH_HEIGHT,
            HorizontalAlign.CENTER | VerticalAlign.MIDDLE
        )
    }
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
    const { detail, mime } = options || {}
    const outputMime = mime || img.mime || ("image/jpeg" as any)
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

export async function imageTransform(
    url: BufferLike,
    options: ImageTransformOptions & TraceOptions & CancellationOptions
): Promise<Buffer> {
    const { mime } = options || {}
    const img = await prepare(url, { ...(options || {}), detail: "original" })
    const outputMime = mime || img.mime || ("image/jpeg" as any)
    const buf = await img.getBuffer(outputMime)
    return Buffer.from(buf)
}

/**
 * Asynchronously encodes an image for use in Language Learning Models (LLMs).
 *
 * @param url - Source of the image, which can be a URL, Buffer, or Blob.
 * @param options - Options for image processing, including definitions, trace settings, and cancellation handling.
 * @returns A promise resolving to an image encoded as a data URI.
 */
export async function imageEncodeForLLM(
    url: BufferLike,
    options: DefImagesOptions & TraceOptions & CancellationOptions
) {
    const img = await prepare(url, options)
    return await encode(img, options)
}

export async function imageTileEncodeForLLM(
    urls: BufferLike[],
    options: DefImagesOptions & TraceOptions & CancellationOptions
) {
    if (urls.length === 0) {
        dbg(`no images provided for tiling`)
        throw new Error("image: no images provided for tiling")
    }

    const { cancellationToken } = options
    const limit = pLimit(4)
    const imgs = await Promise.all(
        urls.map((url) => limit(() => prepare(url, options)))
    )
    checkCancelled(cancellationToken)

    logVerbose(`image: tiling ${imgs.length} images`)
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

export async function renderImageToTerminal(
    url: BufferLike,
    options: {
        columns: number
        rows: number
        label?: string
    } & CancellationOptions
) {
    assert(!!url, "image buffer")
    const { columns, rows, label } = options
    const image = await prepare(url, {
        maxWidth: Math.max(16, Math.min(126, (columns >> 1) - 2)),
        maxHeight: Math.max(16, Math.min(126, rows - 4)),
    })
    const { width, height } = image
    const title = label ? ellipse(label, width * 2 - 2) : ""
    const res: string[] = [
        wrapColor(
            CONSOLE_COLOR_DEBUG,
            "┌─" + title + "─".repeat(width * 2 - title.length - 1) + "┐\n"
        ),
    ]
    const wall = wrapColor(CONSOLE_COLOR_DEBUG, "│")
    for (let y = 0; y < height; ++y) {
        res.push(wall)
        for (let x = 0; x < width; ++x) {
            const c = image.getPixelColor(x, y)
            const cc = c ? wrapRgbColor(c >> 8, " ", true) : " "
            res.push(cc, cc)
        }
        res.push(wall, "\n")
    }
    res.push(
        wrapColor(CONSOLE_COLOR_DEBUG, "└" + "─".repeat(width * 2) + "┘\n")
    )
    return res.join("")
}
