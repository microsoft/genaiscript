export function convertThinkToMarkdown(md: string) {
    if (!md) return md

    md = md.replace(/<think>(.*?)($|<\/think>)/gis, (_, text, end) => {
        return `<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>`
    })
    return md
}
