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
