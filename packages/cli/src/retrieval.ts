import { resolveFileContents } from "../../core/src/file"
import { expandFiles } from "../../core/src/fs"
import { fuzzSearch } from "../../core/src/fuzzsearch"
import { dotGenaiscriptPath, normalizeInt } from "../../core/src/util"
import { vectorSearch } from "../../core/src/vectorsearch"
import { YAMLStringify } from "../../core/src/yaml"
import { createProgressSpinner } from "./spinner"

export async function retrievalSearch(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
        name: string
        embeddingsModel: string
    }
) {
    const {
        excludedFiles,
        name: indexName,
        topK,
        embeddingsModel,
    } = options || {}
    const files = (await expandFiles(filesGlobs, excludedFiles)).map(
        (filename) => <WorkspaceFile>{ filename }
    )
    await resolveFileContents(files)
    const folderPath = dotGenaiscriptPath("vectors", indexName ?? "default")
    const res = await vectorSearch(q, files, {
        topK: normalizeInt(topK),
        folderPath,
        embeddingsModel,
    })
    console.log(YAMLStringify(res))
}

export async function retrievalFuzz(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
    }
) {
    let { excludedFiles, topK } = options || {}
    if (!filesGlobs?.length) filesGlobs = ["**"]
    if (!excludedFiles?.length) excludedFiles = ["**/node_modules/**"]
    const files = await expandFiles(filesGlobs, excludedFiles)
    const progress = createProgressSpinner(
        `searching '${q}' in ${files.length} files`
    )
    const res = await fuzzSearch(
        q,
        files.map((filename) => ({ filename })),
        { topK: normalizeInt(topK) }
    )
    progress.stop()
    console.log(YAMLStringify(res))
}
