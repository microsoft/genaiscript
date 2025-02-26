import { toBase64 } from "../../core/src/base64"
import { isBinaryMimeType } from "../../core/src/binary"
import { deleteUndefinedValues, isEmptyString } from "../../core/src/cleaners"
import { fileTypeFromBuffer } from "../../core/src/filetype"
import { buffer } from "node:stream/consumers"
import { logVerbose } from "../../core/src/util"
import prettyBytes from "pretty-bytes"

export async function readStdIn(): Promise<WorkspaceFile> {
    const { stdin } = process

    if (!stdin || stdin.isTTY || !stdin.readableLength) return undefined

    const data = await buffer(stdin)
    if (data?.length === 0) return undefined

    let mime = await fileTypeFromBuffer(data)
    const res = isBinaryMimeType(mime?.mime)
        ? ({
              filename: `stdin.${mime?.ext || "bin"}`,
              content: toBase64(data),
              encoding: "base64",
              size: data.length,
              type: mime?.mime,
          } satisfies WorkspaceFile)
        : ({
              filename: `stdin.${mime?.ext || "txt"}`,
              content: data.toString("utf-8"),
              size: data.length,
              type: mime?.mime,
          } satisfies WorkspaceFile)

    logVerbose(`stdin: ${res.filename} (${prettyBytes(res.size)})`)
    return deleteUndefinedValues(res)
}
