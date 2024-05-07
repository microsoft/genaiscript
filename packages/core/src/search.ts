import MiniSearch from "minisearch"
import { resolveFileContent } from "./file"
import { TraceOptions } from "./trace"

export async function search(
    files: WorkspaceFile[],
    query: string,
    options?: {
        /**
         * Controls whether to perform fuzzy search. It can be a simple boolean, or a
         * number, or a function.
         *
         * If a boolean is given, fuzzy search with a default fuzziness parameter is
         * performed if true.
         *
         * If a number higher or equal to 1 is given, fuzzy search is performed, with
         * a maximum edit distance (Levenshtein) equal to the number.
         *
         * If a number between 0 and 1 is given, fuzzy search is performed within a
         * maximum edit distance corresponding to that fraction of the term length,
         * approximated to the nearest integer. For example, 0.2 would mean an edit
         * distance of 20% of the term length, so 1 character in a 5-characters term.
         * The calculated fuzziness value is limited by the `maxFuzzy` option, to
         * prevent slowdown for very long queries.
         *
         * If a function is passed, the function is called upon search with a search
         * term, a positional index of that term in the tokenized search query, and
         * the tokenized search query. It should return a boolean or a number, with
         * the meaning documented above.
         */
        fuzzy?: boolean | number
        /**
         * Controls the maximum fuzziness when using a fractional fuzzy value. This is
         * set to 6 by default. Very high edit distances usually don't produce
         * meaningful results, but can excessively impact search performance.
         */
        maxFuzzy?: number
    } & TraceOptions
) {
    const { trace, ...otherOptions } = options || {}
    // load all files
    for (const file of files) await resolveFileContent(file)

    const miniSearch = new MiniSearch({
        idField: "filename",
        fields: ["content"],
        storeFields: ["content"],
        searchOptions: otherOptions,
    })

    // Add documents to the index
    miniSearch.addAll(files.filter((f) => !!f.content))

    // Search for documents:
    const results = miniSearch.search(query)
    return results.map((r) => ({
        filename: r.id,
        content: r.content,
        score: r.score,
    }))
}
