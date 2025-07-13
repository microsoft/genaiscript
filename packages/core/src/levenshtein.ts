// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export async function levenshteinDistance(a: string, b: string): Promise<number> {
  // Using the fastest-levenshtein package for efficient distance calculation
  const { distance } = await import("fastest-levenshtein");
  return distance(a, b);
}
