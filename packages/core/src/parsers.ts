import { JSON5TryParse } from "./json5"
import { PDFTryParse } from "./pdf"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse } from "./yaml"

export function createParsers(): Parsers {
    return {
        JSON5: (text) => JSON5TryParse(text),
        YAML: (text) => YAMLTryParse(text),
        TOML: (text) => TOMLTryParse(text),
        PDF: async (fileOrUrl) => {
            const pages = await PDFTryParse(fileOrUrl)
            return {
                file: pages
                    ? <LinkedFile>{
                          filename: fileOrUrl,
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
