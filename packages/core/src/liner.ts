export function addLineNumbers(text: string) {
    return text
        .split("\n")
        .map((line, i) => `[${i + 1}] ${line}`)
        .join("\n")
}

export function removeLineNumbers(text: string) {
    return text
        .split("\n")
        .map((line) => line.replace(/^\[\d+\] /, ""))
        .join("\n")
}
