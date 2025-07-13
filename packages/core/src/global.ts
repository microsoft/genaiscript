// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const originalConsole = resolveGlobal().console;

/**
 * This file defines global utilities and installs them into the global context.
 * It includes functions to parse and stringify various data formats, handle errors,
 * and manage GitHub and Git clients. The utilities are frozen to prevent modification.
 */

/**
 * Resolves the global context depending on the environment.
 * @returns The global object depending on the current environment.
 * @throws Will throw an error if the global context cannot be determined.
 */
export function resolveGlobal(): any {
  if (typeof window !== "undefined")
    return window; // Browser environment
  else if (typeof self !== "undefined")
    return self; // Web worker environment
  else if (typeof global !== "undefined") return global; // Node.js environment
  return globalThis;
}
