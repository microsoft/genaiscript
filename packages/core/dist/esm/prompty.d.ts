import type { PromptyDocument } from "./types.js";
/**
 * Parses a prompty document from a given filename and text content.
 *
 * @param filename - The name of the file being processed. This is used to associate metadata with the document.
 * @param text - The raw text of the document, including optional frontmatter and content body.
 * @returns An object representing the parsed prompty document. It includes metadata, parsed frontmatter, remaining content, and extracted messages.
 *
 * The parsing process:
 * - Splits the document into frontmatter and content using a helper function.
 * - Converts frontmatter content into metadata via a transformation function.
 * - Processes the content to extract structured message blocks, identified by "system", "user", or "assistant" roles.
 * - Each message block is trimmed and stored alongside its role for further use.
 * - Throws an error if improper formatting, such as whitespace before frontmatter markers, is detected.
 */
export declare function promptyParse(filename: string, text: string): PromptyDocument;
/**
 * Converts a PromptyDocument into a script compatible with GenAI.
 *
 * @param doc - The PromptyDocument containing metadata, content, and messages.
 *    - `meta`: Metadata extracted from the document's frontmatter, such as model, parameters, and other configuration values.
 *    - `messages`: Array of chat messages with roles (system, user, assistant) and respective content.
 *
 * Generates a script string by mapping chat roles and content into reusable GenAI script components:
 * - System messages are represented using `writeText`.
 * - Assistant messages are processed using `parsers.jinja`.
 * - User message content is rendered as Jinja templates or other compatible parts (e.g., text, image_url, input_audio).
 *
 * Returns a string containing the final generated AI script.
 */
export declare function promptyToGenAIScript(doc: PromptyDocument): string;
//# sourceMappingURL=prompty.d.ts.map