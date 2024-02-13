import { JSON5TryParse } from "./json5"
import { PDFTryParse, tryImportPdfjs } from "./pdf"
import { TOMLTryParse } from "./toml"
import { MarkdownTrace } from "./trace"
import { YAMLTryParse } from "./yaml"

function filenameOrFileToContent(fileOrContent: string | LinkedFile): string {
    return typeof fileOrContent === "string"
        ? fileOrContent
        : fileOrContent.content
}

export function createParsers(trace: MarkdownTrace): Parsers {
    return {
        JSON5: (text) => JSON5TryParse(filenameOrFileToContent(text)),
        YAML: (text) => YAMLTryParse(filenameOrFileToContent(text)),
        TOML: (text) => TOMLTryParse(filenameOrFileToContent(text)),
        PDF: async (file) => {
            await tryImportPdfjs(trace)
            const filename = typeof file === "string" ? file : file.filename
            const pages = await PDFTryParse(filename)
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
