// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";

/**
 * Shows a quick pick with a timeout. If the timeout is reached, the promise resolves to undefined.
 * This is useful for preventing UI operations from hanging indefinitely, especially when:
 * - Working with potentially slow data sources
 * - Providing a fallback when user interaction is not guaranteed
 * - Implementing automated timeouts for better UX
 * 
 * @param items The items to show in the quick pick
 * @param options The options for the quick pick
 * @param timeoutMs The timeout in milliseconds (default: 60000 - 1 minute)
 * @returns A promise that resolves to the selected item or undefined if cancelled or timed out
 */
export async function showQuickPickWithTimeout<T extends vscode.QuickPickItem>(
    items: readonly T[] | Thenable<readonly T[]>,
    options?: vscode.QuickPickOptions,
    timeoutMs: number = 60000
): Promise<T | undefined> {
    return Promise.race([
        vscode.window.showQuickPick(items, options),
        new Promise<undefined>((resolve) => {
            setTimeout(() => resolve(undefined), timeoutMs);
        })
    ]);
}

/**
 * Shows an information message after a delay unless cancelled.
 * This is useful for showing status updates or confirmations that don't require immediate attention.
 * 
 * @param message The message to show
 * @param delayMs The delay in milliseconds before showing the message (default: 3000 - 3 seconds)
 * @param items Optional items to show as actions in the information message
 * @returns A disposable that can be used to cancel the delayed message
 */
export function showDelayedInformationMessage(
    message: string,
    delayMs: number = 3000,
    ...items: string[]
): vscode.Disposable {
    let timeoutId: NodeJS.Timeout | undefined;
    
    timeoutId = setTimeout(() => {
        vscode.window.showInformationMessage(message, ...items);
        timeoutId = undefined;
    }, delayMs);
    
    return new vscode.Disposable(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    });
}

