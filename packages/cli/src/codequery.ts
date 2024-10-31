import { resolveFileContent } from "../../core/src/file"
import {
    serializeQueryCapture,
    treeSitterQuery,
} from "../../core/src/treesitter"
import { YAMLStringify } from "../../core/src/yaml"
import { host } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"

/**
 * Executes a code query using Tree-sitter on specified files and outputs the results in YAML format.
 *
 * This function utilizes Tree-sitter to perform queries on code files that match a given glob pattern.
 * It respects .gitignore rules when searching for files and outputs the results in a structured YAML format.
 *
 * @param files - A glob pattern to match files for querying.
 * @param query - The Tree-sitter query to be executed on each file.
 */
export async function codeQuery(files: string, query: OptionsOrString<"tags">) {
    // Find files matching the given pattern, respecting .gitignore rules.
    const ffs = await host.findFiles(files, {
        applyGitIgnore: true, // Ensure .gitignore rules are applied when finding files
    })
    const captures: any[] = [] // Array to store query result captures

    // Iterate through each matched file
    for (const filename of ffs) {
        logVerbose(`scanning ${filename}`) // Log the current file being scanned

        // Initialize a WorkspaceFile object with filename and undefined content
        const f: WorkspaceFile = { filename, content: undefined }

        // Resolve and load the file content
        await resolveFileContent(f)

        // Skip if the file content couldn't be loaded
        if (!f.content) continue

        // Execute the Tree-sitter query on the file content
        const res = await treeSitterQuery(f, query)

        // Serialize and collect the query capture results
        captures.push(
            ...res.captures.map((r) => serializeQueryCapture(f.filename, r))
        )
    }

    // Output the collected captures in YAML format
    console.log(YAMLStringify(captures))
}
