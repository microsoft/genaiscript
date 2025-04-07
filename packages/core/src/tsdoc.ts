export async function tsDocParse(text: string): Promise<any> {
    const { TSDocParser, ParserContext } = await import("@microsoft/tsdoc")

    const tsdocParser = new TSDocParser()

    // Analyze the input doc comment
    const res = tsdocParser.parseString(text)

    // return doc comment
    const docComment = res.docComment
}
