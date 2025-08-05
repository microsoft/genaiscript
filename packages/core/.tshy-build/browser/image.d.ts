import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { ImageGenerationUsage } from "./chat.js";
import type { BufferLike, DefImagesOptions, ImageTransformOptions } from "./types.js";
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
export declare function imageTransform(url: BufferLike, options: ImageTransformOptions & TraceOptions & CancellationOptions): Promise<Buffer>;
/**
 * Encodes an image for use in Language Learning Models (LLMs).
 *
 * @param url - The source of the image, which can be a URL, Buffer, or Blob.
 * @param options - Configuration for image processing, including detail level, trace settings, cancellation handling, MIME type, scaling, cropping, rotation, greyscale, and auto-cropping.
 * @returns A promise that resolves to the image encoded as a data URI.
 */
export declare function imageEncodeForLLM(url: BufferLike, options: DefImagesOptions & TraceOptions & CancellationOptions): Promise<{
    width: number;
    height: number;
    type: any;
    url: string;
    detail: "low" | "high";
}>;
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
export declare function imageTileEncodeForLLM(urls: BufferLike[], options: DefImagesOptions & TraceOptions & CancellationOptions): Promise<{
    width: number;
    height: number;
    type: any;
    url: string;
    detail: "low" | "high";
}>;
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
export declare function renderImageToTerminal(url: BufferLike, options: {
    columns: number;
    rows: number;
    label?: string;
    modelId?: string;
    usage?: ImageGenerationUsage;
} & CancellationOptions): Promise<string>;
//# sourceMappingURL=image.d.ts.map