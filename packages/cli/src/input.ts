import { select, input, confirm } from "@inquirer/prompts"

/**
 * Provides utility functions to interact with users via the command line.
 * Functions include selection of options, text input, and confirmation prompts.
 */

/**
 * Asks the user to select between options.
 * @param message - The question to present to the user.
 * @param choices - An array of options for the user to choose from.
 * @param options - Optional configuration for the select prompt.
 * @returns A promise that resolves to the selected option as a string.
 */
export async function shellSelect(
    message: string,
    choices: string[],
    options?: ShellSelectOptions
): Promise<string> {
    const res = await select<string>({
        ...(options || {}), // Spread operator to include any optional configurations
        message, // The message/question to display
        choices: choices.map((o) => (typeof o === "string" ? { value: o } : o)), // Map choices to ensure they are in the correct format
    })
    return res // Return the selected option
}

/**
 * Asks the user to input a text.
 * @param message - The message to present to the user.
 * @param options - Optional configuration for the input prompt.
 * @returns A promise that resolves to the entered text as a string.
 */
export async function shellInput(
    message: string,
    options?: ShellInputOptions
): Promise<string> {
    const res = await input({
        ...(options || {}), // Include optional configurations if any
        message, // The message to display to the user
    })
    return res // Return the entered text
}

/**
 * Asks the user to confirm a message.
 * @param message - The message to present to the user, typically a yes/no question.
 * @param options - Optional configuration for the confirm prompt.
 * @returns A promise that resolves to true if the user confirms, false otherwise.
 */
export async function shellConfirm(
    message: string,
    options?: ShellConfirmOptions
): Promise<boolean> {
    const res = await confirm({
        ...(options || {}), // Include optional configurations if any
        message, // The message to display, usually a yes/no question
    })
    return res // Return true if confirmed, false otherwise
}
