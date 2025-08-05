"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageTransform = imageTransform;
exports.imageEncodeForLLM = imageEncodeForLLM;
exports.imageTileEncodeForLLM = imageTileEncodeForLLM;
exports.renderImageToTerminal = renderImageToTerminal;
const bufferlike_js_1 = require("./bufferlike.js");
const constants_js_1 = require("./constants.js");
const util_js_1 = require("./util.js");
const p_limit_1 = __importDefault(require("p-limit"));
const cancellation_js_1 = require("./cancellation.js");
const consolecolor_js_1 = require("./consolecolor.js");
const console_1 = require("console");
const debug_js_1 = require("./debug.js");
const usage_js_1 = require("./usage.js");
const pretty_js_1 = require("./pretty.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("image");
async function prepare(url, options) {
    // Dynamically import the Jimp library and its alignment enums
    const { cancellationToken, autoCrop, maxHeight, maxWidth, scale, rotate, greyscale, crop, flip, detail, } = options;
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    dbg(`loading image`);
    // https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images
    // If the URL is a string, resolve it to a data URI
    const buffer = await (0, bufferlike_js_1.resolveBufferLike)(url);
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    // failed to resolve buffer
    if (!buffer) {
        dbg(`failed to resolve image`);
        return undefined;
    }
    // Read the image using Jimp
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp");
    const img = await Jimp.read(buffer);
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const { width, height } = img;
    if (crop) {
        dbg(`cropping image with provided dimensions`);
        const x = Math.max(0, Math.min(width, crop.x ?? 0));
        const y = Math.max(0, Math.min(height, crop.y ?? 0));
        const w = Math.max(1, Math.min(width - x, crop.w ?? width));
        const h = Math.max(1, Math.min(height - y, crop.h ?? height));
        img.crop({ x, y, w, h });
    }
    if (!isNaN(scale)) {
        dbg(`scaling image by factor ${scale}`);
        img.scale(scale);
    }
    if (!isNaN(rotate)) {
        dbg(`rotating image by ${rotate} degrees`);
        img.rotate(rotate);
    }
    if (flip) {
        dbg(`flipping image`, flip);
        img.flip(flip);
    }
    // Contain the image within specified max dimensions if provided
    if (options.maxWidth ?? options.maxHeight) {
        if (options.maxWidth && !options.maxHeight) {
            if (img.width > options.maxWidth) {
                dbg(`resize width to %d`, options.maxWidth);
                img.resize({
                    w: options.maxWidth,
                    h: Math.ceil((img.height / img.width) * options.maxWidth),
                });
            }
        }
        else if (options.maxHeight && !options.maxWidth) {
            if (img.height > options.maxHeight) {
                dbg(`resize height to %d`, options.maxHeight);
                img.resize({
                    h: options.maxHeight,
                    w: Math.ceil((img.width / img.height) * options.maxHeight),
                });
            }
        }
        else {
            dbg(`containing image within ${options.maxWidth || ""}x${options.maxHeight || ""}`);
            contain(img, img.width > maxWidth ? maxWidth : img.width, img.height > maxHeight ? maxHeight : img.height, HorizontalAlign.CENTER | VerticalAlign.MIDDLE);
        }
    }
    // Auto-crop the image if required by options
    if (autoCrop) {
        dbg(`auto-cropping image`);
        img.autocrop();
    }
    if (greyscale) {
        dbg(`applying greyscale to image`);
        img.greyscale();
    }
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    // https://platform.openai.com/docs/guides/vision/low-or-high-fidelity-image-understanding#low-or-high-fidelity-image-understanding
    if (detail === "low") {
        dbg(`setting image detail to low`);
        contain(img, Math.min(img.width, constants_js_1.IMAGE_DETAIL_LOW_WIDTH), Math.min(img.height, constants_js_1.IMAGE_DETAIL_LOW_HEIGHT), HorizontalAlign.CENTER | VerticalAlign.MIDDLE);
    }
    else if (detail !== "original") {
        dbg(`setting image detail to low`);
        contain(img, constants_js_1.IMAGE_DETAIL_HIGH_WIDTH, constants_js_1.IMAGE_DETAIL_HIGH_HEIGHT, HorizontalAlign.CENTER | VerticalAlign.MIDDLE);
    }
    return img;
}
function contain(img, width, height, align) {
    if (img.width > width || img.height > height) {
        img.contain({
            w: Math.min(img.width, width),
            h: Math.min(img.height, height),
            align,
        });
    }
}
async function encode(img, options) {
    // Determine the output MIME type, defaulting to image/jpeg
    const { detail, mime } = options || {};
    const outputMime = mime || img.mime || "image/jpeg";
    const buf = await img.getBuffer(outputMime);
    const imageDataUri = `data:${outputMime};base64,${buf.toString("base64")}`;
    // Return the encoded image data URI
    return {
        width: img.width,
        height: img.height,
        type: outputMime,
        url: imageDataUri,
        detail,
    };
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
async function imageTransform(url, options) {
    const { mime } = options || {};
    const img = await prepare(url, { ...(options || {}), detail: "original" });
    const outputMime = mime || img.mime || "image/jpeg";
    const buf = await img.getBuffer(outputMime);
    return Buffer.from(buf);
}
/**
 * Encodes an image for use in Language Learning Models (LLMs).
 *
 * @param url - The source of the image, which can be a URL, Buffer, or Blob.
 * @param options - Configuration for image processing, including detail level, trace settings, cancellation handling, MIME type, scaling, cropping, rotation, greyscale, and auto-cropping.
 * @returns A promise that resolves to the image encoded as a data URI.
 */
async function imageEncodeForLLM(url, options) {
    const img = await prepare(url, options);
    if (!img)
        return undefined;
    return await encode(img, options);
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
async function imageTileEncodeForLLM(urls, options) {
    if (urls.length === 0) {
        dbg(`no images provided for tiling`);
        throw new Error("image: no images provided for tiling");
    }
    const { cancellationToken } = options;
    const limit = (0, p_limit_1.default)(4);
    const imgs = await Promise.all(urls.map((url) => limit(() => prepare(url, options))));
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    (0, util_js_1.logVerbose)(`image: tiling ${imgs.length} images`);
    const imgw = imgs.reduce((acc, img) => Math.max(acc, img.width), 0);
    const imgh = imgs.reduce((acc, img) => Math.max(acc, img.height), 0);
    const ncols = Math.ceil(Math.sqrt(imgs.length));
    const nrows = Math.ceil(imgs.length / ncols);
    const width = ncols * imgw;
    const height = nrows * imgh;
    const { Jimp, HorizontalAlign, VerticalAlign } = await import("jimp");
    const canvas = new Jimp({ width, height });
    for (let i = 0; i < imgs.length; i++) {
        const ci = Math.floor(i / nrows);
        const ri = i % nrows;
        const x = ci * imgw;
        const y = ri * imgh;
        canvas.composite(imgs[i], x, y);
    }
    contain(canvas, constants_js_1.IMAGE_DETAIL_HIGH_WIDTH, constants_js_1.IMAGE_DETAIL_HIGH_HEIGHT, HorizontalAlign.CENTER | VerticalAlign.MIDDLE);
    return await encode(canvas, { ...options, detail: undefined });
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
async function renderImageToTerminal(url, options) {
    (0, console_1.assert)(!!url, "image buffer");
    const { columns, rows, label, usage, modelId } = options;
    const image = await prepare(url, {
        maxWidth: Math.max(16, Math.min(126, (columns >> 1) - 2)),
        maxHeight: Math.max(16, Math.min(126, rows - 4)),
    });
    const { width, height } = image;
    const title = label ? (0, util_js_1.ellipse)(label, width * 2 - 2) : "";
    const res = [
        (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, `${constants_js_1.BOX_DOWN_AND_RIGHT}${constants_js_1.BOX_RIGHT}` +
            title +
            constants_js_1.BOX_RIGHT.repeat(width * 2 - title.length - 1) +
            `${constants_js_1.BOX_LEFT_AND_DOWN}\n`),
    ];
    const wall = (0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, constants_js_1.BOX_UP_AND_DOWN);
    for (let y = 0; y < height; ++y) {
        res.push(wall);
        for (let x = 0; x < width; ++x) {
            const c = image.getPixelColor(x, y);
            const cc = c ? (0, consolecolor_js_1.wrapRgbColor)(c >> 8, " ", true) : " ";
            res.push(cc, cc);
        }
        res.push(wall, "\n");
    }
    const cost = (0, usage_js_1.estimateImageCost)(modelId, usage);
    const usageStr = usage
        ? [
            `${constants_js_1.CHAR_UP_DOWN_ARROWS}${usage.total_tokens}`,
            `${constants_js_1.CHAR_UP_ARROW}${usage.input_tokens}`,
            `${constants_js_1.CHAR_DOWN_ARROW}${usage.output_tokens}`,
            (0, pretty_js_1.prettyCost)(cost),
        ].join(" ")
        : "";
    res.push((0, consolecolor_js_1.wrapColor)(constants_js_1.CONSOLE_COLOR_DEBUG, constants_js_1.BOX_UP_AND_RIGHT +
        usageStr +
        constants_js_1.BOX_RIGHT.repeat(width * 2 - usageStr.length) +
        `${constants_js_1.BOX_LEFT_AND_UP}\n`));
    return res.join("");
}
//# sourceMappingURL=image.js.map