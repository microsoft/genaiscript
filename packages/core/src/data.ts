import { readFile } from "fs/promises"
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
} from "./constants"
import { CSVParse, CSVTryParse } from "./csv"
import { splitMarkdown } from "./frontmatter"
import { INIParse, INITryParse } from "./ini"
import { JSON5parse } from "./json5"
import { TOMLParse } from "./toml"
import { XLSXParse } from "./xlsx"
import { XMLParse } from "./xml"
import { YAMLParse } from "./yaml"
import { resolveFileContent } from "./file"
import { TraceOptions } from "./trace"
import { host } from "./host"
import { fromBase64 } from "./base64"

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
        else if (TOML_REGEX.test(filename)) data = TOMLParse(content)
        else if (JSON5_REGEX.test(filename))
            data = JSON5parse(content, { repair: true })
        else if (YAML_REGEX.test(filename)) data = YAMLParse(content)
        else if (XML_REGEX.test(filename)) data = XMLParse(content, options)
        else if (MD_REGEX.test(filename) || MDX_REGEX.test(filename))
            data = YAMLParse(splitMarkdown(content).frontmatter)
        else {
            return undefined // unknown
        }
    }
    return data
}
