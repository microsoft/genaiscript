import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { ParsePdfResponse, ParseService, host } from "./host"
import { TraceOptions } from "./trace"
import { installImport } from "./import"
import { logError } from "./util"
import { PDFJS_DIST_VERSION } from "./version"
import os from "os"
import { serializeError } from "./error"

// please some typescript warnings
declare global {
    export type SVGGraphics = any
}

async function tryImportPdfjs(options?: TraceOptions) {
    const { trace } = options || {}
    try {
        installPromiseWithResolversShim()
        const pdfjs = await import("pdfjs-dist")
        let workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs")
        if (os.platform() === "win32")
            workerSrc = "file://" + workerSrc.replace(/\\/g, "/")
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        return pdfjs
    } catch (e) {
        trace?.error(
            `pdfjs-dist not found, installing ${PDFJS_DIST_VERSION}...`,
            e
        )
        await installImport("pdfjs-dist", PDFJS_DIST_VERSION, trace)
        const pdfjs = await import("pdfjs-dist")
        let workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs")
        if (os.platform() === "win32")
            workerSrc = "file://" + workerSrc.replace(/\\/g, "/")
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        return pdfjs
    }
}

function installPromiseWithResolversShim() {
    (Promise as any).withResolvers ||
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
 * parses pdfs, require pdfjs-dist to be installed
 * @param fileOrUrl
 * @param content
 * @returns
 */
async function PDFTryParse(
    fileOrUrl: string,
    content?: Uint8Array,
    options?: { disableCleanup?: boolean } & TraceOptions
): Promise<ParsePdfResponse> {
    const { disableCleanup, trace } = options || {}
    try {
        const pdfjs = await tryImportPdfjs(options)
        const { getDocument } = pdfjs
        const data = content || (await host.readFile(fileOrUrl))
        const loader = await getDocument({
            data,
            useSystemFonts: true,
        })
        const doc = await loader.promise
        const numPages = doc.numPages
        const pages: string[] = []
        for (let i = 0; i < numPages; i++) {
            const page = await doc.getPage(1 + i) // 1-indexed
            const content = await page.getTextContent()
            const items: TextItem[] = content.items.filter(
                (item): item is TextItem => "str" in item
            )
            let { lines } = parsePageItems(items)
            if (!disableCleanup)
                lines = lines.map((line) => line.replace(/[\t ]+$/g, ""))
            // collapse trailing spaces
            pages.push(lines.join("\n"))
        }
        return { ok: true, pages }
    } catch (error) {
        trace?.error(`reading pdf`, error)
        return { ok: false, error: serializeError(error) }
    }
}

function PDFPagesToString(pages: string[]) {
    return pages?.join("\n\n-------- Page Break --------\n\n")
}

export async function parsePdf(
    filename: string,
    options?: ParsePDFOptions & TraceOptions
): Promise<{ pages: string[]; content: string }> {
    const { trace, filter } = options || {}
    await host.parser.init(trace)
    let { pages } = await host.parser.parsePdf(filename, options)
    if (filter) pages = pages.filter((page, index) => filter(index, page))
    const content = PDFPagesToString(pages)
    return { pages, content }
}

export function createBundledParsers(): ParseService {
    return {
        init: async (trace) => {
            await tryImportPdfjs({ trace })
        },
        async parsePdf(
            filename: string,
            options?: TraceOptions
        ): Promise<ParsePdfResponse> {
            return await PDFTryParse(filename, undefined, options)
        },
    }
}

// to avoid cjs loading issues of pdfjs-dist, move this function in house
// https://github.com/electrovir/pdf-text-reader
function parsePageItems(pdfItems: TextItem[]) {
    const lineData: { [y: number]: TextItem[] } = {}

    for (let i = 0; i < pdfItems.length; i++) {
        const item = pdfItems[i]
        const y = item?.transform[5]
        if (!lineData.hasOwnProperty(y)) {
            lineData[y] = []
        }
        // how how to intentionally test this
        /* istanbul ignore next */
        if (item) {
            lineData[y]?.push(item)
        }
    }

    const yCoords = Object.keys(lineData)
        .map((key) => Number(key))
        // b - a here because the bottom is y = 0 so we want that to be last
        .sort((a, b) => b - a)
        // insert an empty line between any 2 lines where their distance is greater than the upper line's height
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

                // currentY - nextY because currentY will be higher than nextY
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
        // idk how to actually test this
        /* istanbul ignore next */
        if (y == undefined) {
            continue
        }
        // sort by x position (position in line)
        const lineItems = lineData[y]!.sort(
            (a, b) => a.transform[4] - b.transform[4]
        ).filter((item) => !!item.str)
        const firstLineItem = lineItems[0]!
        let line = lineItems.length ? firstLineItem.str : ""
        for (let j = 1; j < lineItems.length; j++) {
            const item = lineItems[j]!
            const lastItem = lineItems[j - 1]!
            const xDiff =
                item.transform[4] - (lastItem.transform[4] + lastItem.width)

            // insert spaces for items that are far apart horizontally
            // idk how to trigger this
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
