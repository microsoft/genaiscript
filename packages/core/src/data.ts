import {
    XLSX_REGEX,
    CSV_REGEX,
    INI_REGEX,
    TOML_REGEX,
    JSON5_REGEX,
    YAML_REGEX,
    XML_REGEX,
    MD_REGEX,
    MDX_REGEX,
    JSONL_REGEX,
} from "./constants"
import { CSVTryParse } from "./csv"
import { splitMarkdown } from "./frontmatter"
import { INITryParse } from "./ini"
import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { XLSXParse } from "./xlsx"
import { XMLTryParse } from "./xml"
import { YAMLTryParse } from "./yaml"
import { resolveFileContent } from "./file"
import { TraceOptions } from "./trace"
import { host } from "./host"
import { fromBase64 } from "./base64"
import { JSONLTryParse } from "./jsonl"

export async function dataTryParse(
    file: WorkspaceFile,
    options?: TraceOptions & XMLParseOptions & INIParseOptions & CSVParseOptions
) {
    await resolveFileContent(file)

    const { filename, content, encoding } = file
    let data: any
    if (XLSX_REGEX.test(filename))
        data = await XLSXParse(
            encoding === "base64"
                ? fromBase64(content)
                : await host.readFile(filename)
        )
    else {
        if (CSV_REGEX.test(filename)) data = CSVTryParse(content, options)
        else if (INI_REGEX.test(filename)) data = INITryParse(content, options)
        else if (TOML_REGEX.test(filename)) data = TOMLTryParse(content)
        else if (JSON5_REGEX.test(filename))
            data = JSON5TryParse(content, { repair: true })
        else if (YAML_REGEX.test(filename)) data = YAMLTryParse(content)
        else if (XML_REGEX.test(filename)) data = XMLTryParse(content, options)
        else if (JSONL_REGEX.test(filename)) data = JSONLTryParse(content)
        else if (MD_REGEX.test(filename) || MDX_REGEX.test(filename))
            data = YAMLTryParse(splitMarkdown(content).frontmatter)
        else {
            return undefined // unknown
        }
    }
    return data
}
