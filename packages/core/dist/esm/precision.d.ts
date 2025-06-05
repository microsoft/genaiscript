/**
 * Rounds a number to the specified number of decimal places with precision.
 *
 * @param x - The number to be rounded. Returns NaN if undefined.
 * @param digits - The number of decimal places to round to. Defaults to 0 if invalid.
 * @param round - The rounding function to use (e.g., Math.round). Defaults to Math.round.
 * @returns The rounded number, or NaN if the input is undefined.
 */
export declare function roundWithPrecision(
  x: number | undefined,
  digits: number,
  round?: (x: number) => number,
): number;
/**
 * Formats a number with the specified number of decimal places, using rounding logic.
 *
 * @param x - The number to format. Returns "?" if undefined.
 * @param digits - The number of decimal places to include in the formatted output.
 * @param round - A custom rounding function. Defaults to Math.round.
 * @returns A string representing the number formatted with the specified precision.
 */
export declare function renderWithPrecision(
  x: number | undefined,
  digits: number,
  round?: (x: number) => number,
): string;
//# sourceMappingURL=precision.d.ts.map
