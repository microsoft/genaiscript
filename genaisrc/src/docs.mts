// normalizes the docstring in case the LLM decides not to generate proper comments
export function docify(docs: string) {
    docs = parsers.unfence(docs, "*")
    if (!/^\/\*\*.*.*\*\/$/s.test(docs))
        docs = `/**\n* ${docs.split(/\r?\n/g).join("\n* ")}\n*/`
    return docs.replace(/\n+$/, "")
}
