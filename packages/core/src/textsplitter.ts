// forked from https://raw.githubusercontent.com/Stevenic/vectra/refs/heads/main/src/TextSplitter.ts
// removed tokenizer dependency

export interface TextSplitterConfig {
    separators: string[]
    keepSeparators: boolean
    chunkSize: number
    chunkOverlap: number
    tokenizer: Tokenizer
    docType?: string
}

export interface TextChunk {
    text: string
    tokens: number[]
    startPos: number
    endPos: number
    startOverlap: number[]
    endOverlap: number[]
}

export function unchunk(text: string, chunks: TextChunk[]) {
    let rebuild = ""
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (i === 0 && chunk.startPos > 0)
            rebuild += text.slice(0, chunk.startPos)
        rebuild += text.slice(chunk.startPos, chunk.endPos)
        if (chunk.endPos < text.length) {
            const nextChuk = chunks[i + 1]
            rebuild += text.slice(chunk.endPos, nextChuk?.startPos)
        }
    }
    return rebuild
}

export class TextSplitter {
    private readonly _config: TextSplitterConfig

    constructor(config?: Partial<TextSplitterConfig>) {
        this._config = Object.assign(
            {
                keepSeparators: false,
                chunkSize: 400,
                chunkOverlap: 40,
            } as TextSplitterConfig,
            config
        )

        if (!this._config.tokenizer) throw new Error("Tokenizer is required")

        // Use default separators if none are provided
        if (!this._config.separators || this._config.separators.length === 0) {
            this._config.separators = this.getSeparators(this._config.docType)
        }

        // Validate the config settings
        if (this._config.chunkSize < 1) {
            throw new Error("chunkSize must be >= 1")
        } else if (this._config.chunkOverlap < 0) {
            throw new Error("chunkOverlap must be >= 0")
        } else if (this._config.chunkOverlap > this._config.chunkSize) {
            throw new Error("chunkOverlap must be <= chunkSize")
        }
    }

    public split(text: string): TextChunk[] {
        if (!text) return []
        
        // Get basic chunks
        const chunks = this.recursiveSplit(text, this._config.separators, 0)

        const that = this
        function getOverlapTokens(tokens?: number[]): number[] {
            if (tokens != undefined) {
                const len =
                    tokens.length > that._config.chunkOverlap
                        ? that._config.chunkOverlap
                        : tokens.length
                return tokens.slice(0, len)
            } else {
                return []
            }
        }

        // Add overlap tokens and text to the start and end of each chunk
        if (this._config.chunkOverlap > 0) {
            for (let i = 1; i < chunks.length; i++) {
                const previousChunk = chunks[i - 1]
                const chunk = chunks[i]
                const nextChunk =
                    i < chunks.length - 1 ? chunks[i + 1] : undefined
                chunk.startOverlap = getOverlapTokens(
                    previousChunk.tokens.reverse()
                ).reverse()
                chunk.endOverlap = getOverlapTokens(nextChunk?.tokens)
            }
        }

        return chunks
    }

    private recursiveSplit(
        text: string,
        separators: string[],
        startPos: number
    ): TextChunk[] {
        const chunks: TextChunk[] = []
        if (text.length > 0) {
            // Split text into parts
            let parts: string[]
            let separator = ""
            const nextSeparators =
                separators.length > 1 ? separators.slice(1) : []
            if (separators.length > 0) {
                // Split by separator
                separator = separators[0]
                parts =
                    separator == " "
                        ? this.splitBySpaces(text)
                        : text.split(separator)
            } else {
                // Cut text in half
                const half = Math.floor(text.length / 2)
                parts = [text.substring(0, half), text.substring(half)]
            }

            // Iterate over parts
            for (let i = 0; i < parts.length; i++) {
                const lastChunk = i === parts.length - 1

                // Get chunk text and endPos
                let chunk = parts[i]
                const endPos =
                    startPos +
                    (chunk.length - 1) +
                    (lastChunk ? 0 : separator.length)
                if (this._config.keepSeparators && !lastChunk) {
                    chunk += separator
                }

                // Ensure chunk contains text
                if (
                    !this._config.keepSeparators &&
                    !this.containsAlphanumeric(chunk)
                ) {
                    continue
                }

                // Optimization to avoid encoding really large chunks
                if (chunk.length / 6 > this._config.chunkSize) {
                    // Break the text into smaller chunks
                    const subChunks = this.recursiveSplit(
                        chunk,
                        nextSeparators,
                        startPos
                    )
                    chunks.push(...subChunks)
                } else {
                    // Encode chunk text
                    const tokens = this._config.tokenizer.encode(chunk)
                    if (tokens.length > this._config.chunkSize) {
                        // Break the text into smaller chunks
                        const subChunks = this.recursiveSplit(
                            chunk,
                            nextSeparators,
                            startPos
                        )
                        chunks.push(...subChunks)
                    } else {
                        // Append chunk to output
                        chunks.push({
                            text: chunk,
                            tokens: tokens,
                            startPos: startPos,
                            endPos: endPos,
                            startOverlap: [],
                            endOverlap: [],
                        })
                    }
                }

                // Update startPos
                startPos = endPos + 1
            }
        }

        return this.combineChunks(chunks)
    }

    private combineChunks(chunks: TextChunk[]): TextChunk[] {
        const combinedChunks: TextChunk[] = []
        let currentChunk: TextChunk | undefined
        let currentLength = 0
        const separator = this._config.keepSeparators ? "" : " "
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (currentChunk) {
                const length = currentChunk.tokens.length + chunk.tokens.length
                if (length > this._config.chunkSize) {
                    combinedChunks.push(currentChunk)
                    currentChunk = chunk
                    currentLength = chunk.tokens.length
                } else {
                    currentChunk.text += separator + chunk.text
                    currentChunk.endPos = chunk.endPos
                    currentChunk.tokens.push(...chunk.tokens)
                    currentLength += chunk.tokens.length
                }
            } else {
                currentChunk = chunk
                currentLength = chunk.tokens.length
            }
        }
        if (currentChunk) {
            combinedChunks.push(currentChunk)
        }
        return combinedChunks
    }

    private containsAlphanumeric(text: string): boolean {
        return /[a-z0-9]/i.test(text)
    }

    private splitBySpaces(text: string): string[] {
        // Split text by tokens and return parts
        const parts: string[] = []
        let tokens = this._config.tokenizer.encode(text)
        do {
            if (tokens.length <= this._config.chunkSize) {
                parts.push(this._config.tokenizer.decode(tokens))
                break
            } else {
                const span = tokens.splice(0, this._config.chunkSize)
                parts.push(this._config.tokenizer.decode(span))
            }
        } while (true)

        return parts
    }

    private getSeparators(docType?: string): string[] {
        switch (docType ?? "") {
            case "cpp":
                return [
                    // Split along class definitions
                    "\nclass ",
                    // Split along function definitions
                    "\nvoid ",
                    "\nint ",
                    "\nfloat ",
                    "\ndouble ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\nswitch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "go":
                return [
                    // Split along function definitions
                    "\nfunc ",
                    "\nvar ",
                    "\nconst ",
                    "\ntype ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nswitch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "java":
            case "c#":
            case "csharp":
            case "cs":
            case "ts":
            case "tsx":
            case "typescript":
                return [
                    // split along regions
                    "// LLM-REGION",
                    "/* LLM-REGION",
                    "/** LLM-REGION",
                    // Split along class definitions
                    "\nclass ",
                    // Split along method definitions
                    "\npublic ",
                    "\nprotected ",
                    "\nprivate ",
                    "\nstatic ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\nswitch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "js":
            case "jsx":
            case "javascript":
                return [
                    // split along regions
                    "// LLM-REGION",
                    "/* LLM-REGION",
                    "/** LLM-REGION",
                    // Split along class definitions
                    "\nclass ",
                    // Split along function definitions
                    "\nfunction ",
                    "\nconst ",
                    "\nlet ",
                    "\nvar ",
                    "\nclass ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\nswitch ",
                    "\ncase ",
                    "\ndefault ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "php":
                return [
                    // Split along function definitions
                    "\nfunction ",
                    // Split along class definitions
                    "\nclass ",
                    // Split along control flow statements
                    "\nif ",
                    "\nforeach ",
                    "\nwhile ",
                    "\ndo ",
                    "\nswitch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "proto":
                return [
                    // Split along message definitions
                    "\nmessage ",
                    // Split along service definitions
                    "\nservice ",
                    // Split along enum definitions
                    "\nenum ",
                    // Split along option definitions
                    "\noption ",
                    // Split along import statements
                    "\nimport ",
                    // Split along syntax declarations
                    "\nsyntax ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "python":
            case "py":
                return [
                    // First, try to split along class definitions
                    "\nclass ",
                    "\ndef ",
                    "\n\tdef ",
                    // Now split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "rst":
                return [
                    // Split along section titles
                    "\n===\n",
                    "\n---\n",
                    "\n***\n",
                    // Split along directive markers
                    "\n.. ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "ruby":
                return [
                    // Split along method definitions
                    "\ndef ",
                    "\nclass ",
                    // Split along control flow statements
                    "\nif ",
                    "\nunless ",
                    "\nwhile ",
                    "\nfor ",
                    "\ndo ",
                    "\nbegin ",
                    "\nrescue ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "rust":
                return [
                    // Split along function definitions
                    "\nfn ",
                    "\nconst ",
                    "\nlet ",
                    // Split along control flow statements
                    "\nif ",
                    "\nwhile ",
                    "\nfor ",
                    "\nloop ",
                    "\nmatch ",
                    "\nconst ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "scala":
                return [
                    // Split along class definitions
                    "\nclass ",
                    "\nobject ",
                    // Split along method definitions
                    "\ndef ",
                    "\nval ",
                    "\nvar ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\nmatch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "swift":
                return [
                    // Split along function definitions
                    "\nfunc ",
                    // Split along class definitions
                    "\nclass ",
                    "\nstruct ",
                    "\nenum ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\ndo ",
                    "\nswitch ",
                    "\ncase ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "md":
            case "markdown":
                return [
                    // First, try to split along Markdown headings (starting with level 2)
                    "\n## ",
                    "\n### ",
                    "\n#### ",
                    "\n##### ",
                    "\n###### ",
                    // Note the alternative syntax for headings (below) is not handled here
                    // Heading level 2
                    // ---------------
                    // End of code block
                    "```\n\n",
                    // Horizontal lines
                    "\n\n***\n\n",
                    "\n\n---\n\n",
                    "\n\n___\n\n",
                    // Note that this splitter doesn't handle horizontal lines defined
                    // by *three or more* of ***, ---, or ___, but this is not handled
                    // Github tables
                    "<table>",
                    // "<tr>",
                    // "<td>",
                    // "<td ",
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "latex":
                return [
                    // First, try to split along Latex sections
                    "\n\\chapter{",
                    "\n\\section{",
                    "\n\\subsection{",
                    "\n\\subsubsection{",

                    // Now split by environments
                    "\n\\begin{enumerate}",
                    "\n\\begin{itemize}",
                    "\n\\begin{description}",
                    "\n\\begin{list}",
                    "\n\\begin{quote}",
                    "\n\\begin{quotation}",
                    "\n\\begin{verse}",
                    "\n\\begin{verbatim}",

                    // Now split by math environments
                    "\n\\begin{align}",
                    "$$",
                    "$",

                    // Now split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            case "html":
                return [
                    // First, try to split along HTML tags
                    "<body>",
                    "<div>",
                    "<p>",
                    "<br>",
                    "<li>",
                    "<h1>",
                    "<h2>",
                    "<h3>",
                    "<h4>",
                    "<h5>",
                    "<h6>",
                    "<span>",
                    "<table>",
                    "<tr>",
                    "<td>",
                    "<th>",
                    "<ul>",
                    "<ol>",
                    "<header>",
                    "<footer>",
                    "<nav>",
                    // Head
                    "<head>",
                    "<style>",
                    "<script>",
                    "<meta>",
                    "<title>",
                    // Normal type of lines
                    " ",
                ]
            case "sol":
                return [
                    // Split along compiler informations definitions
                    "\npragma ",
                    "\nusing ",
                    // Split along contract definitions
                    "\ncontract ",
                    "\ninterface ",
                    "\nlibrary ",
                    // Split along method definitions
                    "\nconstructor ",
                    "\ntype ",
                    "\nfunction ",
                    "\nevent ",
                    "\nmodifier ",
                    "\nerror ",
                    "\nstruct ",
                    "\nenum ",
                    // Split along control flow statements
                    "\nif ",
                    "\nfor ",
                    "\nwhile ",
                    "\ndo while ",
                    "\nassembly ",
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                ]
            default:
                return [
                    // Split by the normal type of lines
                    "\n\n",
                    "\n",
                    " ",
                    "",
                ]
        }
    }
}
