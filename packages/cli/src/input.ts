import { select, input, confirm } from "@inquirer/prompts"
/**
 * Asks the user to select between options
 * @param message question to ask
 * @param choices options to select from
 */
export async function shellSelect(
    message: string,
    choices: string[],
    options?: ShellSelectOptions
): Promise<string> {
    const res = await select<string>({
        ...(options || {}),
        message,
        choices: choices.map((o) => (typeof o === "string" ? { value: o } : o)),
    })
    return res
}

/**
 * Asks the user to input a text
 * @param message message to ask
 */
export async function shellInput(
    message: string,
    options?: ShellInputOptions
): Promise<string> {
    const res = await input({
        ...(options || {}),
        message,
    })
    return res
}

/**
 * Asks the user to confirm a message
 * @param message message to ask
 */
export async function shellConfirm(
    message: string,
    options?: ShellConfirmOptions
): Promise<boolean> {
    const res = await confirm({
        ...(options || {}),
        message,
    })
    return res
}
