import { type ShellConfirmOptions, type ShellInputOptions, type ShellSelectOptions } from "@genaiscript/core";
/**
 * Provides utility functions to interact with users via the command line.
 * Functions include selection of options, text input, and confirmation prompts.
 */
/**
 * Asks the user to select between options.
 * @param message - The question to present to the user.
 * @param choices - An array of options for the user to choose from. Each option is mapped to ensure it is in the correct format.
 * @param options - Optional configuration for the select prompt, spread into the prompt configuration.
 * @returns A promise that resolves to the selected option as a string.
 */
export declare function shellSelect(message: string, choices: string[], options?: ShellSelectOptions): Promise<string>;
/**
 * Asks the user to input a text.
 * @param message - The message to present to the user.
 * @param options - Optional configuration for the input prompt.
 * @returns A promise that resolves to the entered text as a string.
 */
export declare function shellInput(message: string, options?: ShellInputOptions): Promise<string>;
/**
 * Asks the user to confirm a message.
 * @param message - The message to present to the user, typically a yes/no question.
 * @param options - Optional configuration for the confirm prompt.
 * @returns A promise that resolves to true if the user confirms, false otherwise.
 */
export declare function shellConfirm(message: string, options?: ShellConfirmOptions): Promise<boolean>;
/**
 * Prompts the user for confirmation or skips the prompt in a CI environment.
 *
 * @param message - The prompt message to display to the user.
 * @param options - Optional configuration for the prompt.
 * @param options.preview - An optional preview message to display before the prompt. If provided, it will be logged before the prompt.
 * @returns A promise that resolves to `true` if the user confirmed, if running in CI, or if the message was already confirmed, and `false` otherwise.
 */
export declare function confirmOrSkipInCI(message: string, options?: {
    preview?: string;
}): Promise<boolean>;
//# sourceMappingURL=input.d.ts.map