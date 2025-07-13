// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { nanoid } from "nanoid";

/**
 * Generates a unique identifier.
 *
 * @returns A unique identifier string.
 */
export function generateId(): string {
  return nanoid();
}
