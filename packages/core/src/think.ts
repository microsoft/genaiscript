export function convertThinkToMarkdown(md: string) {
    if (!md) return md

    md = md.replace(/<think>(.*?)($|<\/think>)/gis, (_, text) => {
        return `<details><summary>🤔 think</summary>${text}</details>`
    })
    return md
}
