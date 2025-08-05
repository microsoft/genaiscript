import type { Parsers } from "./types.js";
/**
 * Asynchronously creates a set of parsers for handling various file formats, data operations,
 * and transformations.
 *
 * @param options - Configuration options for parser creation.
 *   - model: Specifies the language model to use for token encoding.
 *   - trace: Optional tracing options for logging or debugging.
 *   - cancellationToken: Optional cancellation token to abort operations.
 *
 * @returns An object containing various parser methods:
 *   - JSON5: Parses JSON5 content with an optional default value.
 *   - JSONLLM: Parses JSON extracted for LLM-specific workflows.
 *   - JSONL: Parses JSONL (JSON Lines) content.
 *   - YAML: Parses YAML content with an optional default value.
 *   - XML: Parses XML content with an optional default value and additional options.
 *   - TOML: Parses TOML content.
 *   - frontmatter: Extracts frontmatter content from text.
 *   - CSV: Parses CSV content with optional parsing options.
 *   - XLSX: Parses Excel files asynchronously with optional parsing options.
 *   - dotEnv: Parses .env files.
 *   - INI: Parses INI configuration content with an optional default value.
 *   - transcription: Parses VTT/SRT transcription files.
 *   - unzip: Extracts contents of a ZIP file asynchronously.
 *   - tokens: Estimates token usage for provided content using specified encoders.
 *   - fences: Extracts fenced code blocks from content.
 *   - annotations: Parses annotated text data.
 *   - HTMLToText: Converts HTML content to plain text with optional configurations.
 *   - HTMLToMarkdown: Converts HTML content to Markdown with optional configurations.
 *   - DOCX: Parses DOCX files asynchronously.
 *   - PDF: Parses PDF files asynchronously, extracting pages, images, and file content.
 *   - math: Evaluates mathematical expressions with a given scope.
 *   - validateJSON: Validates JSON content against a schema.
 *   - mustache: Renders Mustache templates with provided arguments.
 *   - jinja: Renders Jinja templates with provided data.
 *   - diff: Computes a diff between two inputs and formats it.
 *   - tidyData: Cleans and processes data rows with optional configurations.
 *   - hash: Computes cryptographic hashes for the given input.
 *   - unfence: Removes fencing around content.
 *   - GROQ: Evaluates GROQ (Graph-Relational Object Queries).
 *   - unthink: Performs a reverse-thinking operation on data.
 *   - dedent: Dedents indented text content.
 *   - encodeIDs: Encodes identifiers for use in various operations.
 */
export declare function createParsers(): Parsers;
//# sourceMappingURL=parsers.d.ts.map