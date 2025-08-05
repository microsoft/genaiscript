"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdf = parsePdf;
const host_js_1 = require("./host.js");
const node_os_1 = __importDefault(require("node:os"));
const error_js_1 = require("./error.js");
const util_js_1 = require("./util.js");
const constants_js_1 = require("./constants.js");
const global_js_1 = require("./global.js");
const types_1 = require("util/types");
const crypto_js_1 = require("./crypto.js");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const fs_js_1 = require("./fs.js");
const yaml_js_1 = require("./yaml.js");
const cleaners_js_1 = require("./cleaners.js");
const cancellation_js_1 = require("./cancellation.js");
const performance_js_1 = require("./performance.js");
const workdir_js_1 = require("./workdir.js");
const debug_js_1 = require("./debug.js");
const node_url_1 = require("node:url");
const pathUtils_js_1 = require("./pathUtils.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("pdf");
let standardFontDataUrl;
/**
 * Attempts to import pdfjs and configure worker source
 * based on the operating system.
 * @param options - Optional tracing options
 * @returns A promise resolving to the pdfjs module
 */
async function tryImportPdfjs() {
    installPromiseWithResolversShim(); // Ensure Promise.withResolvers is available
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    let workerSrc = (0, pathUtils_js_1.moduleResolve)("pdfjs-dist/build/pdf.worker.min.mjs");
    dbg(`workerSrc: %s`, workerSrc);
    // Adjust worker source path for Windows platform
    if (node_os_1.default.platform() === "win32") {
        workerSrc = "file://" + workerSrc.replace(/\\/g, "/");
        dbg("detected Windows platform, worker: %s", workerSrc);
    }
    standardFontDataUrl = (0, node_url_1.pathToFileURL)(workerSrc.replace("build/pdf.worker.min.mjs", "standard_fonts/")).toString();
    dbg(`standardFontDataUrl: %s`, standardFontDataUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    return pdfjs;
}
class CanvasFactory {
    static createCanvas;
    constructor() { }
    create(width, height) {
        if (width <= 0 || height <= 0) {
            dbg("invalid canvas dimensions: width=%d, height=%d", width, height);
            throw new Error("Invalid canvas size");
        }
        const canvas = this._createCanvas(width, height);
        return {
            canvas,
            context: canvas.getContext("2d"),
        };
    }
    reset(canvasAndContext, width, height) {
        if (!canvasAndContext.canvas) {
            dbg("reset called with missing canvas");
            throw new Error("Canvas is not specified");
        }
        if (width <= 0 || height <= 0) {
            dbg("reset called with invalid canvas size: width=%d, height=%d", width, height);
            throw new Error("Invalid canvas size");
        }
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
        if (!canvasAndContext.canvas) {
            dbg("destroy called with missing canvas");
            throw new Error("Canvas is not specified");
        }
        // Zeroing the width and height cause Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
    /**
     * @ignore
     */
    _createCanvas(width, height) {
        return CanvasFactory.createCanvas(width, height);
    }
}
async function tryImportCanvas() {
    if (CanvasFactory.createCanvas) {
        return CanvasFactory.createCanvas;
    }
    try {
        dbg(`initializing pdf canvas`);
        const canvas = await import("@napi-rs/canvas");
        const createCanvas = (w, h) => canvas.createCanvas(w, h);
        const glob = (0, global_js_1.resolveGlobal)();
        glob.ImageData ??= canvas.ImageData;
        glob.Path2D ??= canvas.Path2D;
        glob.Canvas ??= canvas.Canvas;
        glob.DOMMatrix ??= canvas.DOMMatrix;
        CanvasFactory.createCanvas = createCanvas;
        dbg(`pdf canvas initialized`);
        return createCanvas;
    }
    catch (error) {
        (0, util_js_1.logWarn)("Failed to import canvas");
        (0, util_js_1.logVerbose)(error);
        return undefined;
    }
}
/**
 * Installs a shim for Promise.withResolvers if not available.
 */
function installPromiseWithResolversShim() {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    Promise.withResolvers ||
        (Promise.withResolvers = function () {
            let rs, rj;
            const pm = new this((resolve, reject) => {
                rs = resolve;
                rj = reject;
            });
            return {
                resolve: rs,
                reject: rj,
                promise: pm,
            };
        });
}
var ImageKind;
(function (ImageKind) {
    ImageKind[ImageKind["GRAYSCALE_1BPP"] = 1] = "GRAYSCALE_1BPP";
    ImageKind[ImageKind["RGB_24BPP"] = 2] = "RGB_24BPP";
    ImageKind[ImageKind["RGBA_32BPP"] = 3] = "RGBA_32BPP";
})(ImageKind || (ImageKind = {}));
async function computeHashFolder(filename, options) {
    const { content, ...rest } = options;
    const h = await (0, crypto_js_1.hash)([typeof filename === "string" ? { filename } : filename, content, rest], {
        readWorkspaceFiles: true,
        version: true,
        length: constants_js_1.PDF_HASH_LENGTH,
    });
    return (0, workdir_js_1.dotGenaiscriptPath)("cache", "pdf", h);
}
/**
 * Parses PDF files using pdfjs-dist.
 * @param fileOrUrl - The file path or URL of the PDF
 * @param content - Optional PDF content as a Uint8Array
 * @param options - Options including disableCleanup and tracing
 * @returns An object indicating success or failure and the parsed pages
 */
async function PDFTryParse(fileOrUrl, content, options) {
    const { cancellationToken, disableCleanup, trace, renderAsImage, scale = constants_js_1.PDF_SCALE, cache, useSystemFonts, } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const folder = await computeHashFolder(fileOrUrl, {
        content,
        ...(options || {}),
    });
    const resFilename = (0, node_path_1.join)(folder, "res.json");
    const readCache = async () => {
        if (cache === false) {
            dbg("cache is disabled, skipping cache read");
            return undefined;
        }
        try {
            const res = JSON.parse(await (0, promises_1.readFile)(resFilename, {
                encoding: "utf-8",
            }));
            dbg(`cache hit at ${folder}`);
            return res;
        }
        catch {
            return undefined;
        }
    };
    {
        // try cache hit
        const cached = await readCache();
        if (cached) {
            dbg("cache hit for pdf parsing, returning cached result");
            return cached;
        }
    }
    (0, util_js_1.logVerbose)(`pdf: decoding ${fileOrUrl || ""} in ${folder}`);
    trace?.itemValue(`pdf: decoding ${fileOrUrl || ""}`, folder);
    await (0, fs_js_1.ensureDir)(folder);
    const m = (0, performance_js_1.measure)("parsers.pdf");
    try {
        const createCanvas = await tryImportCanvas();
        const pdfjs = await tryImportPdfjs();
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        const { getDocument } = pdfjs;
        const data = content || (await runtimeHost.readFile(fileOrUrl));
        // Check if we're running on Windows
        const isWindows = node_os_1.default.platform() === "win32";
        const loader = await getDocument({
            data,
            useSystemFonts: useSystemFonts ?? !isWindows,
            disableFontFace: true,
            standardFontDataUrl,
            CanvasFactory: createCanvas ? CanvasFactory : undefined,
        });
        const doc = await loader.promise;
        const pdfMetadata = await doc.getMetadata();
        const metadata = pdfMetadata
            ? (0, cleaners_js_1.deleteUndefinedValues)({
                info: (0, cleaners_js_1.deleteUndefinedValues)({
                    ...(pdfMetadata.info || {}),
                }),
            })
            : undefined;
        const numPages = doc.numPages;
        const pages = [];
        // Iterate through each page and extract text content
        for (let i = 0; i < numPages; i++) {
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            const page = await doc.getPage(1 + i); // 1-indexed
            const content = await page.getTextContent();
            const items = content.items.filter((item) => "str" in item);
            let { lines } = parsePageItems(items);
            // Optionally clean up trailing spaces
            if (!disableCleanup) {
                dbg("trailing whitespace cleanup enabled for page lines");
                lines = lines.map((line) => line.replace(/[\t ]+$/g, ""));
            }
            // Collapse trailing spaces
            const p = {
                index: i + 1,
                content: lines.join("\n"),
            };
            await (0, promises_1.writeFile)((0, node_path_1.join)(folder, `page_${p.index}.txt`), p.content);
            pages.push(p);
            if (createCanvas && renderAsImage) {
                dbg("rendering page %d as PNG image", i + 1);
                const viewport = page.getViewport({ scale });
                const canvas = await createCanvas(viewport.width, viewport.height);
                const canvasContext = canvas.getContext("2d");
                const render = page.render({
                    canvasContext: canvasContext,
                    viewport,
                });
                await render.promise;
                const buffer = canvas.toBuffer("image/png");
                p.image = (0, node_path_1.join)(folder, `page_${i + 1}.png`);
                dbg(`writing page image %d to %s`, i + 1, p.image);
                await (0, promises_1.writeFile)(p.image, buffer);
            }
            const opList = await page.getOperatorList();
            const figures = [];
            for (let j = 0; j < opList.fnArray.length; j++) {
                const fn = opList.fnArray[j];
                const args = opList.argsArray[j];
                if (fn === pdfjs.OPS.paintImageXObject && args) {
                    dbg("found image XObject in operator list at index %d", j);
                    const imageObj = args[0];
                    if (imageObj) {
                        (0, cancellation_js_1.checkCancelled)(cancellationToken);
                        const img = await new Promise((resolve) => {
                            if (page.commonObjs.has(imageObj)) {
                                resolve(page.commonObjs.get(imageObj));
                            }
                            else if (page.objs.has(imageObj)) {
                                page.objs.get(imageObj, (r) => {
                                    resolve(r);
                                });
                            }
                            else {
                                resolve(undefined);
                            }
                        });
                        if (!img) {
                            continue;
                        }
                        const fig = await decodeImage(p.index, img, createCanvas, imageObj, folder);
                        if (fig) {
                            figures.push(fig);
                        }
                    }
                }
            }
            p.figures = figures;
            (0, util_js_1.logVerbose)(`pdf: extracted ${fileOrUrl || ""} page ${i + 1} / ${numPages}, ${p.figures.length ? `${p.figures.length} figures` : ""}`);
        }
        const res = (0, cleaners_js_1.deleteUndefinedValues)({
            metadata,
            pages,
            content: PDFPagesToString(pages),
        });
        await (0, promises_1.writeFile)((0, node_path_1.join)(folder, "content.txt"), res.content);
        await (0, promises_1.writeFile)(resFilename, JSON.stringify(res));
        return res;
    }
    catch (error) {
        (0, util_js_1.logVerbose)(error);
        {
            // try cache hit
            const cached = await readCache();
            if (cached) {
                return cached;
            }
        }
        trace?.error(`reading pdf`, error); // Log error if tracing is enabled
        await (0, fs_js_1.ensureDir)(folder);
        await (0, promises_1.writeFile)((0, node_path_1.join)(folder, "error.txt"), (0, yaml_js_1.YAMLStringify)((0, error_js_1.serializeError)(error)));
        return { error: (0, error_js_1.serializeError)(error) };
    }
    finally {
        m();
    }
    async function decodeImage(pageIndex, img, createCanvas, imageObj, folder) {
        if (!(0, types_1.isUint8ClampedArray)(img?.data) && !(0, types_1.isUint8Array)(img?.data)) {
            dbg("cannot decode—image data is not of type Uint8Array or Uint8ClampedArray");
            return undefined;
        }
        const { width, height, data: _data, kind } = img;
        const imageData = new ImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dstIdx = (y * width + x) * 4;
                imageData.data[dstIdx + 3] = 255; // A
                if (kind === ImageKind.GRAYSCALE_1BPP) {
                    const srcIdx = y * width + x;
                    imageData.data[dstIdx + 0] = _data[srcIdx]; // B
                    imageData.data[dstIdx + 1] = _data[srcIdx]; // G
                    imageData.data[dstIdx + 2] = _data[srcIdx]; // R
                }
                else {
                    const srcIdx = (y * width + x) * (kind === ImageKind.RGBA_32BPP ? 4 : 3);
                    imageData.data[dstIdx + 0] = _data[srcIdx]; // B
                    imageData.data[dstIdx + 1] = _data[srcIdx + 1]; // G
                    imageData.data[dstIdx + 2] = _data[srcIdx + 2]; // R
                }
            }
        }
        const canvas = await createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0);
        const buffer = canvas.toBuffer("image/png");
        const fn = (0, node_path_1.join)(folder, `page-${pageIndex}-${imageObj.replace(constants_js_1.INVALID_FILENAME_REGEX, "")}.png`);
        dbg(`writing image to %s`, fn);
        await (0, promises_1.writeFile)(fn, buffer);
        return {
            id: imageObj,
            width,
            height,
            type: "image/png",
            size: buffer.length,
            filename: fn,
        };
    }
}
/**
 * Joins pages into a single string with page breaks.
 * @param pages - Array of page content strings
 * @returns A single string representing the entire document
 */
function PDFPagesToString(pages) {
    return pages?.map((p) => `-------- Page ${p.index} --------\n\n${p.content}`).join("\n\n");
}
/**
 * Parses a PDF file or buffer and extracts its pages, content, and metadata.
 * @param filenameOrBuffer - Path to the PDF file or a buffer containing PDF data.
 * @param options - Optional settings for filtering, tracing, caching, rendering, and cancellation.
 * @returns A promise resolving to an object with parsed pages, concatenated content, and metadata. Returns empty pages and content if an error occurs. Metadata may be undefined if not present.
 */
async function parsePdf(filenameOrBuffer, options) {
    const filename = typeof filenameOrBuffer === "string" ? filenameOrBuffer : undefined;
    const bytes = typeof filenameOrBuffer === "string" ? undefined : filenameOrBuffer;
    const { pages, metadata, content, error } = await PDFTryParse(filename, bytes, options);
    if (error) {
        dbg("pdf parsing returned error: %O", error);
        return { pages: [], content: "" };
    }
    return { pages, content, metadata };
}
/**
 * Parses text items from a PDF page into lines.
 * @param pdfItems - Array of text items
 * @returns An object containing parsed lines
 */
function parsePageItems(pdfItems) {
    const lineData = {};
    // Group text items by their vertical position (y-coordinate)
    for (let i = 0; i < pdfItems.length; i++) {
        const item = pdfItems[i];
        const y = item?.transform[5];
        if (!lineData.hasOwnProperty(y)) {
            // dbg("grouping text item at y=%d into new line", y)
            lineData[y] = [];
        }
        // Ensure the item is valid before adding
        /* istanbul ignore next */
        if (item) {
            // dbg("adding item to lineData at y=%d: %o", y, item)
            lineData[y]?.push(item);
        }
    }
    const yCoords = Object.keys(lineData)
        .map((key) => Number(key))
        // Sort by descending y-coordinate
        .sort((a, b) => b - a)
        // Insert empty lines based on line height differences
        .reduce((accum, currentY, index, array) => {
        const nextY = array[index + 1];
        if (nextY != undefined) {
            const currentLine = lineData[currentY];
            const currentLineHeight = currentLine.reduce((finalValue, current) => (finalValue > current.height ? finalValue : current.height), -1);
            // Check if a new line is needed based on height
            if (Math.floor((currentY - nextY) / currentLineHeight) > 1) {
                const newY = currentY - currentLineHeight;
                lineData[newY] = [];
                return accum.concat(currentY, newY);
            }
        }
        return accum.concat(currentY);
    }, []);
    const lines = [];
    for (let i = 0; i < yCoords.length; i++) {
        const y = yCoords[i];
        // Ensure y-coordinate is defined
        /* istanbul ignore next */
        if (y == undefined) {
            continue;
        }
        // Sort by x position within each line
        const lineItems = lineData[y].sort((a, b) => a.transform[4] - b.transform[4]).filter((item) => !!item.str);
        const firstLineItem = lineItems[0];
        let line = lineItems.length ? firstLineItem.str : "";
        // Concatenate text items into a single line
        for (let j = 1; j < lineItems.length; j++) {
            const item = lineItems[j];
            const lastItem = lineItems[j - 1];
            const xDiff = item.transform[4] - (lastItem.transform[4] + lastItem.width);
            // Insert spaces for horizontally distant items
            /* istanbul ignore next */
            if (item.height !== 0 &&
                lastItem.height !== 0 &&
                (xDiff > item.height || xDiff > lastItem.height)) {
                const spaceCountA = Math.ceil(xDiff / item.height);
                let spaceCount = spaceCountA;
                if (lastItem.height !== item.height) {
                    const spaceCountB = Math.ceil(xDiff / lastItem.height);
                    spaceCount = spaceCountA > spaceCountB ? spaceCountA : spaceCountB;
                }
                line += Array(spaceCount).fill("").join(" ");
            }
            line += item.str;
        }
        lines.push(line);
    }
    return {
        lines,
    };
}
//# sourceMappingURL=pdf.js.map