import type { DocxParseOptions } from "@genaiscript/core";
/**
 * This module provides various parsing utilities for different file types such
 * as PDF, DOCX, HTML, JSONL, and more. It includes functions to extract and
 * convert data, estimate tokens, and transform file formats.
 */
/**
 * Extracts and logs fenced code blocks of a specific language from a file.
 * Filters the fenced blocks by the specified language and logs their content.
 * @param language - The language to filter the fenced blocks by.
 * @param file - The file to parse and extract fenced code blocks from.
 */
export declare function parseFence(language: string, file: string): Promise<void>;
/**
 * Parses the contents of a PDF file and outputs them in text format.
 * Optionally writes the content and page images to the specified output directory.
 * If an output directory is specified, the text content is saved as a .txt file,
 * and page images (if any) are saved as .png files.
 * Logs the writing process for each file.
 * If no output directory is specified, logs the text content to the console.
 * @param file - The PDF file to parse.
 * @param options - Options to include images and specify the output directory.
 *   - images: Whether to include page images in the output.
 *   - out: The output directory where files will be saved.
 */
export declare function parsePDF(file: string, options: {
    images: boolean;
    out: string;
}): Promise<void>;
/**
 * Parses the contents of a DOCX file and logs the extracted text.
 * If an error occurs during parsing, it logs the error.
 * Uses DOCXTryParse to extract text from the DOCX file.
 * @param file - The path to the DOCX file to parse.
 * @param options - Options for parsing the DOCX file.
 */
export declare function parseDOCX(file: string, options: DocxParseOptions): Promise<void>;
/**
 * Converts HTML content to text and logs it or writes it to a file.
 * @param fileOrUrl - The HTML file or URL to convert.
 * @param options - Options to specify the output format ("markdown" or "text") and the output file path.
 */
export declare function parseHTMLToText(fileOrUrl: string, options: {
    format?: "markdown" | "text";
    out?: string;
}): Promise<void>;
/**
 * Parses a Jinja2 file, substitutes variables, and logs the rendered output.
 *
 * @param file - The path to the Jinja2 template file to parse.
 * @param options - An object containing the following properties:
 *   - vars: An array of key-value pairs in the format "key=value" to replace variables in the template.
 *
 * The function reads the template file, processes it based on its type (Prompty or Markdown),
 * substitutes the provided variables, and renders the output. Variable values are converted
 * to numbers if possible. Environment variables are also considered during substitution.
 */
export declare function parseJinja2(file: string, options: {
    vars: string[];
}): Promise<void>;
/**
 * Parses the input file and converts its data into a specified format.
 *
 * @param file - Path to the file to be read and parsed.
 * @param options - Configuration options for the output format.
 * @param options.format - The target format for the output. Supported formats include:
 *   - "yaml": Converts data to YAML format.
 *   - "ini": Converts data to INI format.
 *   - "csv": Converts data into a CSV format with a header row.
 *   - "md" or "markdown": Converts data into a Markdown table.
 *   - "json5": Converts data into JSON5 format.
 *   - Default: Outputs data as a prettified JSON string.
 *
 * Logs the converted data to the console.
 * Throws an error if the data format cannot be determined.
 */
export declare function parseAnyToJSON(file: string, options: {
    format: string;
}): Promise<void>;
/**
 * Converts JSONL files to JSON files.
 * Processes an array of files or glob patterns, skipping non-JSONL files,
 * and writes the converted JSON content to new files with a ".json" extension.
 * Logs the conversion process for each file.
 * @param files - An array of files or glob patterns to process.
 */
export declare function jsonl2json(files: string[]): Promise<void>;
/**
 * Estimates the number of tokens in the content of files and logs the results.
 * @param filesGlobs - An array of files or glob patterns to process.
 * @param options - Options for processing files.
 *   - excludedFiles - A list of files to exclude from processing.
 *   - model - The name of the model used for token encoding.
 *   - ignoreGitIgnore - Whether to ignore .gitignore rules when expanding files.
 */
export declare function parseTokens(filesGlobs: string[], options: {
    excludedFiles: string[];
    model: string;
    ignoreGitIgnore: boolean;
}): Promise<void>;
/**
 * Tokenizes the content of a specified file using a provided model and logs the tokens.
 *
 * @param file - Path to the file to tokenize.
 * @param options - Object containing the following properties:
 *   - model - The name of the model used for token encoding.
 *
 * The function reads the content of the file, tokenizes it using the given model,
 * and logs each token along with its hexadecimal representation.
 * Debug information about the process is also logged.
 */
export declare function parseTokenize(file: string, options: {
    model: string;
}): Promise<void>;
/**
 * Converts "prompty" format files to GenAI script files.
 *
 * @param files - An array of file paths to process.
 * @param options - An object containing the following properties:
 *   - out: The output directory where the converted files will be written.
 *
 * Logs the conversion process and writes the output files to the specified directory or replaces the extension in place if no directory is provided.
 */
export declare function prompty2genaiscript(files: string[], options: {
    out: string;
}): Promise<void>;
/**
 * Scans a list of files for sensitive information or secrets.
 * Logs each file containing secrets and the types of secrets found.
 * Issues a warning if secrets are found in any files.
 *
 * @param files - A list of file paths or glob patterns to scan.
 * Logs the file name and the types of secrets found in each file.
 * Warns if secrets are found in any of the scanned files.
 */
export declare function parseSecrets(files: string[]): Promise<void>;
/**
 * Parses a markdown file, breaks it into chunks based on token limits, and logs a preview of each chunk.
 *
 * @param filename - The name of the markdown file to parse.
 * @param options - Object containing parsing options.
 *   - model - The model name used for token encoding.
 *   - maxTokens - The maximum number of tokens allowed per chunk.
 *   - disableFallback - Whether to disable fallback for token encoding.
 */
export declare function parseMarkdown(filename: string, options: {
    model: string;
    maxTokens: string;
}): Promise<void>;
//# sourceMappingURL=parse.d.ts.map