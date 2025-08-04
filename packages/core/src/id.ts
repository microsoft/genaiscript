// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { nanoid } from "nanoid";

/**
 * Generates a unique identifier.
 *
 * @returns A unique identifier string.
 */
export function generateId(size?: number): string {
  return nanoid(size);
}
