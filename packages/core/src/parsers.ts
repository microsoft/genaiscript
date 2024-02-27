import { CSVTryParse } from "./csv"
import { filenameOrFileToContent } from "./fs"
import { JSON5TryParse } from "./json5"
import { PDFTryParse, tryImportPdfjs } from "./pdf"
import { TOMLTryParse } from "./toml"
import { MarkdownTrace } from "./trace"
import { YAMLTryParse } from "./yaml"

export function createParsers(trace: MarkdownTrace): Parsers {
    return {
        JSON5: (text) => JSON5TryParse(filenameOrFileToContent(text)),
        YAML: (text) => YAMLTryParse(filenameOrFileToContent(text)),
        TOML: (text) => TOMLTryParse(filenameOrFileToContent(text)),
        CSV: (text) => CSVTryParse(filenameOrFileToContent(text)),
        PDF: async (file, options) => {
            const { filter = () => true } = options || {}
            await tryImportPdfjs(trace)
            const filename = typeof file === "string" ? file : file.filename
            const pages = (await PDFTryParse(filename))?.filter((text, index) =>
                filter(index + 1, text)
            )
            return {
                file: pages
                    ? <LinkedFile>{
                          filename,
                          content: pages.join(
                              "\n\n-------- Page Break --------\n\n"
                          ),
                      }
                    : undefined,
                pages,
            }
        },
    }
}
