import { JSONLineCache } from "./cache"
import { DOT_ENV_REGEX } from "./constants"
import { CSVParse, CSVTryParse } from "./csv"
import { dataTryParse } from "./data"
import { NotSupportedError, errorMessage } from "./error"
import { resolveFileContent, toWorkspaceFile } from "./file"
import { filePathOrUrlToWorkspaceFile, readText, writeText } from "./fs"
import { host } from "./host"
import { INITryParse } from "./ini"
import { JSON5parse, JSON5TryParse } from "./json5"
import { logVerbose } from "./util"
import { XMLParse, XMLTryParse } from "./xml"
import { YAMLParse, YAMLTryParse } from "./yaml"

export function createFileSystem(): Omit<WorkspaceFileSystem, "grep"> {
    const fs = {
        findFiles: async (glob, options) => {
            const { readText } = options || {}
            const names = (
                await host.findFiles(glob, {
                    ignore: ["**/.env"],
                    applyGitIgnore: true,
                })
            ).filter((f) => !DOT_ENV_REGEX.test(f))
            const files: WorkspaceFile[] = []
            for (const name of names) {
                const file =
                    readText === false
                        ? <WorkspaceFile>{
                              filename: name,
                              content: undefined,
                          }
                        : await fs.readText(name)
                files.push(file)
            }
            return files
        },
        writeText: async (filename: string, c: string) => {
            if (DOT_ENV_REGEX.test(filename))
                throw new Error("writing .env not allowed")

            await writeText(filename, c)
        },
        readText: async (f: string | Awaitable<WorkspaceFile>) => {
            if (f === undefined)
                throw new NotSupportedError("missing file name")

            const file: WorkspaceFile =
                typeof f === "string"
                    ? {
                          filename: f,
                          content: undefined,
                      }
                    : await f
            if (DOT_ENV_REGEX.test(file.filename)) return file
            try {
                await resolveFileContent(file)
            } catch (e) {
                logVerbose(
                    `error reading file ${file.filename}: ${errorMessage(e)}`
                )
            }
            return file
        },
        readJSON: async (
            f: string | Awaitable<WorkspaceFile>
        ): Promise<any> => {
            const file = await fs.readText(f)
            const res = JSON5TryParse(file.content, undefined)
            return res
        },
        readYAML: async (
            f: string | Awaitable<WorkspaceFile>
        ): Promise<any> => {
            const file = await fs.readText(f)
            const res = YAMLTryParse(file.content)
            return res
        },
        readXML: async (
            f: string | Awaitable<WorkspaceFile>,
            options?: XMLParseOptions
        ) => {
            const file = await fs.readText(f)
            const res = XMLTryParse(file.content, options)
            return res
        },
        readCSV: async <T extends object>(
            f: string | Awaitable<WorkspaceFile>,
            options?: CSVParseOptions
        ): Promise<T[]> => {
            const file = await fs.readText(f)
            const res = CSVTryParse(file.content, options) as T[]
            return res
        },
        readINI: async (
            f: string | Awaitable<WorkspaceFile>,
            options?: INIParseOptions
        ): Promise<any> => {
            const file = await fs.readText(f)
            const res = INITryParse(file.content, options?.defaultValue)
            return res
        },
        readData: async (
            f: string | Awaitable<WorkspaceFile>
        ): Promise<any> => {
            const file = await f
            const data = await dataTryParse(toWorkspaceFile(file))
            return data
        },
        cache: async (name: string) => {
            if (!name) throw new NotSupportedError("missing cache name")
            const res = JSONLineCache.byName<any, any>(name)
            return res
        },
    } satisfies Omit<WorkspaceFileSystem, "grep">
    ;(fs as any).readFile = readText
    return Object.freeze(fs)
}
