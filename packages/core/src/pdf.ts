// Import necessary types and modules
import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { host } from "./host"
import { TraceOptions } from "./trace"
import os from "os"
import { serializeError } from "./error"

// Declare a global type for SVGGraphics as any
declare global {
    export type SVGGraphics = any
}

/**
 * Attempts to import pdfjs and configure worker source
 * based on the operating system.
 * @param options - Optional tracing options
 * @returns A promise resolving to the pdfjs module
 */
async function tryImportPdfjs(options?: TraceOptions) {
    const { trace } = options || {}
    installPromiseWithResolversShim() // Ensure Promise.withResolvers is available
    const pdfjs = await import("pdfjs-dist")
    let workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs")

    // Adjust worker source path for Windows platform
    if (os.platform() === "win32")
        workerSrc = "file://" + workerSrc.replace(/\\/g, "/")

    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
    return pdfjs
}

/**
 * Installs a shim for Promise.withResolvers if not available.
 */
function installPromiseWithResolversShim() {
    ;(Promise as any).withResolvers ||
        ((Promise as any).withResolvers = function () {
            let rs,
                rj,
                pm = new this((resolve: any, reject: any) => {
                    rs = resolve
                    rj = reject
                })
            return {
                resolve: rs,
                reject: rj,
                promise: pm,
            }
        })
}

/**
 * Parses PDF files using pdfjs-dist.
 * @param fileOrUrl - The file path or URL of the PDF
 * @param content - Optional PDF content as a Uint8Array
 * @param options - Options including disableCleanup and tracing
 * @returns An object indicating success or failure and the parsed pages
 */
async function PDFTryParse(
    fileOrUrl: string,
    content?: Uint8Array,
    options?: { disableCleanup?: boolean } & TraceOptions
) {
    const { disableCleanup, trace } = options || {}
    try {
        const pdfjs = await tryImportPdfjs(options)
        const { getDocument } = pdfjs
        // Read data from file or use provided content
        const data = content || (await host.readFile(fileOrUrl))
        const loader = await getDocument({
            data,
            useSystemFonts: true,
        })
        const doc = await loader.promise
        const numPages = doc.numPages
        const pages: string[] = []

        // Iterate through each page and extract text content
        for (let i = 0; i < numPages; i++) {
            const page = await doc.getPage(1 + i) // 1-indexed
            const content = await page.getTextContent()
            const items: TextItem[] = content.items.filter(
                (item): item is TextItem => "str" in item
            )
            let { lines } = parsePageItems(items)

            // Optionally clean up trailing spaces
            if (!disableCleanup)
                lines = lines.map((line) => line.replace(/[\t ]+$/g, ""))

            // Collapse trailing spaces
            pages.push(lines.join("\n"))
        }
        return { ok: true, pages }
    } catch (error) {
        trace?.error(`reading pdf`, error) // Log error if tracing is enabled
        return { ok: false, error: serializeError(error) }
    }
}

/**
 * Joins pages into a single string with page breaks.
 * @param pages - Array of page content strings
 * @returns A single string representing the entire document
 */
function PDFPagesToString(pages: string[]) {
    return pages?.join("\n\n-------- Page Break --------\n\n")
}

/**
 * Parses a PDF file and applies optional filtering.
 * @param filename - The PDF file path
 * @param options - Options including filtering and tracing
 * @returns A promise resolving to the parsed pages and concatenated content
 */
export async function parsePdf(
    filename: string,
    options?: ParsePDFOptions & TraceOptions
): Promise<{ pages: string[]; content: string }> {
    const { trace, filter } = options || {}
    let { pages } = await PDFTryParse(filename, undefined, options)

    // Apply filter if provided
    if (filter) pages = pages.filter((page, index) => filter(index, page))
    const content = PDFPagesToString(pages)
    return { pages, content }
}

/**
 * Parses text items from a PDF page into lines.
 * @param pdfItems - Array of text items
 * @returns An object containing parsed lines
 */
function parsePageItems(pdfItems: TextItem[]) {
    const lineData: { [y: number]: TextItem[] } = {}

    // Group text items by their vertical position (y-coordinate)
    for (let i = 0; i < pdfItems.length; i++) {
        const item = pdfItems[i]
        const y = item?.transform[5]
        if (!lineData.hasOwnProperty(y)) {
            lineData[y] = []
        }
        // Ensure the item is valid before adding
        /* istanbul ignore next */
        if (item) {
            lineData[y]?.push(item)
        }
    }

    const yCoords = Object.keys(lineData)
        .map((key) => Number(key))
        // Sort by descending y-coordinate
        .sort((a, b) => b - a)
        // Insert empty lines based on line height differences
        .reduce((accum: number[], currentY, index, array) => {
            const nextY = array[index + 1]
            if (nextY != undefined) {
                const currentLine = lineData[currentY]!
                const currentLineHeight: number = currentLine.reduce(
                    (finalValue, current) =>
                        finalValue > current.height
                            ? finalValue
                            : current.height,
                    -1
                )

                // Check if a new line is needed based on height
                if (Math.floor((currentY - nextY) / currentLineHeight) > 1) {
                    const newY = currentY - currentLineHeight
                    lineData[newY] = []
                    return accum.concat(currentY, newY)
                }
            }
            return accum.concat(currentY)
        }, [])

    const lines: string[] = []
    for (let i = 0; i < yCoords.length; i++) {
        const y = yCoords[i]
        // Ensure y-coordinate is defined
        /* istanbul ignore next */
        if (y == undefined) {
            continue
        }
        // Sort by x position within each line
        const lineItems = lineData[y]!.sort(
            (a, b) => a.transform[4] - b.transform[4]
        ).filter((item) => !!item.str)
        const firstLineItem = lineItems[0]!
        let line = lineItems.length ? firstLineItem.str : ""

        // Concatenate text items into a single line
        for (let j = 1; j < lineItems.length; j++) {
            const item = lineItems[j]!
            const lastItem = lineItems[j - 1]!
            const xDiff =
                item.transform[4] - (lastItem.transform[4] + lastItem.width)

            // Insert spaces for horizontally distant items
            /* istanbul ignore next */
            if (
                item.height !== 0 &&
                lastItem.height !== 0 &&
                (xDiff > item.height || xDiff > lastItem.height)
            ) {
                const spaceCountA = Math.ceil(xDiff / item.height)
                let spaceCount = spaceCountA
                if (lastItem.height !== item.height) {
                    const spaceCountB = Math.ceil(xDiff / lastItem.height)
                    spaceCount =
                        spaceCountA > spaceCountB ? spaceCountA : spaceCountB
                }
                line += Array(spaceCount).fill("").join(" ")
            }
            line += item.str
        }
        lines.push(line)
    }

    return {
        lines,
    }
}
