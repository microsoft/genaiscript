export function filterMatchesByDiff(diffFiles: DiffFile[], matches: SgNode[]) {
    const newMatches = matches.filter((m) => {
        const chunk = DIFF.findChunk(
            m.getRoot().filename(),
            [m.range().start.line, m.range().end.line],
            diffFiles
        )
        return chunk
    })
    return newMatches
}
