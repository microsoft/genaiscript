import { DOT_ENV_REGEX } from "./constants"
import { NotSupportedError, errorMessage } from "./error"
import { resolveFileContent } from "./file"
import { readText, writeText } from "./fs"
import { host } from "./host"
import { JSON5parse } from "./json5"
import { logVerbose } from "./util"

export function createFileSystem(): Omit<WorkspaceFileSystem, "grep"> {
    const fs: Omit<WorkspaceFileSystem, "grep"> = {
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
        readText: async (f: string | WorkspaceFile) => {
            if (f === undefined)
                throw new NotSupportedError("missing file name")

            const file: WorkspaceFile =
                typeof f === "string"
                    ? {
                          filename: f,
                          content: undefined,
                      }
                    : f
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
        readJSON: async (f: string | WorkspaceFile) => {
            const file = await fs.readText(f)
            const res = JSON5parse(file.content)
            return res
        },
    }
    ;(fs as any).readFile = readText
    return Object.freeze(fs)
}
