// Import necessary functions and types from other modules
import { resolveBufferLike } from "./bufferlike"
import {
    BOX_DOWN_AND_RIGHT,
    BOX_LEFT_AND_DOWN,
    BOX_LEFT_AND_UP,
    BOX_RIGHT,
    BOX_UP_AND_DOWN,
    BOX_UP_AND_RIGHT,
    CHAR_DOWN_ARROW,
    CHAR_UP_ARROW,
    CHAR_UP_DOWN_ARROWS,
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
import { genaiscriptDebug } from "./debug"
import { ImageGenerationUsage } from "./chat"
import { estimateImageCost } from "./usage"
import { prettyCost } from "./pretty"
const dbg = genaiscriptDebug("image")

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

    // failed to resolve buffer
    if (!buffer) {
        dbg(`failed to resolve image`)
        return undefined
    }

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
        if (options.maxWidth && !options.maxHeight) {
            if (img.width > options.maxWidth) {
                dbg(`resize width to %d`, options.maxWidth)
                img.resize({
                    w: options.maxWidth,
                    h: Math.ceil((img.height / img.width) * options.maxWidth),
                })
            }
        } else if (options.maxHeight && !options.maxWidth) {
            if (img.height > options.maxHeight) {
                dbg(`resize height to %d`, options.maxHeight)
                img.resize({
                    h: options.maxHeight,
                    w: Math.ceil((img.width / img.height) * options.maxHeight),
                })
            }
        } else {
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
    const imageDataUri = `data:${outputMime};base64,${buf.toString("base64")}`
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
 * Transforms an image based on the provided options.
 *
 * @param url - The source of the image, which can be a URL, Buffer, or Blob.
 * @param options - Configuration object for image transformation, including:
 *   - mime: Optional MIME type for the output image.
 *   - detail: Optional. Specifies the level of detail for the image (e.g., "original").
 *   - cancellationToken: Optional. Token to handle cancellation of the operation.
 *   - autoCrop: Optional. Indicates whether to automatically crop the image.
 *   - maxHeight: Optional. Maximum height for resizing the image.
 *   - maxWidth: Optional. Maximum width for resizing the image.
 *   - scale: Optional. Scaling factor for resizing the image.
 *   - rotate: Optional. Angle in degrees to rotate the image.
 *   - crop: Optional. Cropping dimensions (x, y, width, height).
 *   - flip: Optional. Specifies whether to flip the image vertically or horizontally.
 *   - greyscale: Optional. Indicates whether to apply a greyscale effect.
 *
 * @returns A Promise that resolves to the transformed image as a Buffer.
 */
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
 * Encodes an image for use in Language Learning Models (LLMs).
 *
 * @param url - The source of the image, which can be a URL, Buffer, or Blob.
 * @param options - Configuration for image processing, including detail level, trace settings, cancellation handling, MIME type, scaling, cropping, rotation, greyscale, and auto-cropping.
 * @returns A promise that resolves to the image encoded as a data URI.
 */
export async function imageEncodeForLLM(
    url: BufferLike,
    options: DefImagesOptions & TraceOptions & CancellationOptions
) {
    const img = await prepare(url, options)
    if (!img) return undefined
    return await encode(img, options)
}

/**
 * Combines multiple images into a single tiled image and encodes it for use in Language Learning Models (LLMs).
 *
 * @param urls - An array of sources for the images to be tiled. Each source can be a URL, Buffer, or another supported format.
 * @param options - Configuration for image processing, including:
 *    - cancellationToken: Token to handle cancellation of the operation.
 *    - detail: Detail level of the images (e.g., high, low, or original).
 *    - mime: Desired MIME type for the output image.
 *    - trace: Debug or trace options.
 *    - crop, scale, rotate, greyscale, autoCrop: Image manipulation settings.
 *    - other supported image generation options.
 *
 * @throws Will throw an error if no images are provided in the input array.
 *
 * @returns A promise resolving to the tiled image encoded as a data URI or other specified format.
 */
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

/**
 * Renders an image to the terminal within specified dimensions, adding an optional label and usage information.
 *
 * @param url - The source of the image, which can be a URL, Buffer, or similar.
 * @param options - Configuration object containing:
 *   - columns: The total number of terminal columns available.
 *   - rows: The total number of terminal rows available.
 *   - label: An optional string to display as the image's label.
 *   - usage: Optional usage statistics to display below the image.
 *   - cancellationToken: Optional token to handle cancellation.
 * @returns A string representation of the image formatted for terminal output.
 */
export async function renderImageToTerminal(
    url: BufferLike,
    options: {
        columns: number
        rows: number
        label?: string
        modelId?: string
        usage?: ImageGenerationUsage
    } & CancellationOptions
) {
    assert(!!url, "image buffer")
    const { columns, rows, label, usage, modelId } = options
    const image = await prepare(url, {
        maxWidth: Math.max(16, Math.min(126, (columns >> 1) - 2)),
        maxHeight: Math.max(16, Math.min(126, rows - 4)),
    })
    const { width, height } = image
    const title = label ? ellipse(label, width * 2 - 2) : ""
    const res: string[] = [
        wrapColor(
            CONSOLE_COLOR_DEBUG,
            `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}` +
                title +
                BOX_RIGHT.repeat(width * 2 - title.length - 1) +
                `${BOX_LEFT_AND_DOWN}\n`
        ),
    ]
    const wall = wrapColor(CONSOLE_COLOR_DEBUG, BOX_UP_AND_DOWN)
    for (let y = 0; y < height; ++y) {
        res.push(wall)
        for (let x = 0; x < width; ++x) {
            const c = image.getPixelColor(x, y)
            const cc = c ? wrapRgbColor(c >> 8, " ", true) : " "
            res.push(cc, cc)
        }
        res.push(wall, "\n")
    }
    const cost = estimateImageCost(modelId, usage)
    const usageStr = usage
        ? [
              `${CHAR_UP_DOWN_ARROWS}${usage.total_tokens}`,
              `${CHAR_UP_ARROW}${usage.input_tokens}`,
              `${CHAR_DOWN_ARROW}${usage.output_tokens}`,
              prettyCost(cost),
          ].join(" ")
        : ""
    res.push(
        wrapColor(
            CONSOLE_COLOR_DEBUG,
            BOX_UP_AND_RIGHT +
                usageStr +
                BOX_RIGHT.repeat(width * 2 - usageStr.length) +
                `${BOX_LEFT_AND_UP}\n`
        )
    )
    return res.join("")
}
