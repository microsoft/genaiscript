/**
 * Generates and prints a structured help document for all CLI commands.
 * The output is formatted as Markdown content with a focus on creating documentation.
 *
 * The function includes a recursive helper to process commands and their subcommands,
 * generating Markdown headers and help text for each command.
 *
 * @param header - The Markdown header level as a string, used to format the documentation.
 * @param parent - The parent command, which may be undefined for top-level commands.
 * @param commands - An array of Command objects to process, including subcommands.
 */
export declare function helpAll(): Promise<void>;
//# sourceMappingURL=help.d.ts.map