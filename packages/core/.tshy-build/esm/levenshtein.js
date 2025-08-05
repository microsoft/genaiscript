// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
export async function levenshteinDistance(a, b) {
    // Using the fastest-levenshtein package for efficient distance calculation
    const { distance } = await import("fastest-levenshtein");
    return distance(a, b);
}
//# sourceMappingURL=levenshtein.js.map