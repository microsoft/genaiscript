// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Rounds a number to the specified number of decimal places with precision.
 *
 * @param x - The number to be rounded. Returns NaN if undefined.
 * @param digits - The number of decimal places to round to. Defaults to 0 if invalid.
 * @param round - The rounding function to use (e.g., Math.round). Defaults to Math.round.
 * @returns The rounded number, or NaN if the input is undefined.
 */
export function roundWithPrecision(
  x: number | undefined,
  digits: number,
  round = Math.round,
): number {
  if (x === undefined) return NaN;
  digits = digits | 0;
  // invalid digits input
  if (digits <= 0) return round(x);
  if (x === 0) return 0;
  let r = 0;
  while (r == 0 && digits < 21) {
    const d = Math.pow(10, digits++);
    r = round(x * d + Number.EPSILON) / d;
  }
  return r;
}

/**
 * Formats a number with the specified number of decimal places, using rounding logic.
 *
 * @param x - The number to format. Returns "?" if undefined.
 * @param digits - The number of decimal places to include in the formatted output.
 * @param round - A custom rounding function. Defaults to Math.round.
 * @returns A string representing the number formatted with the specified precision.
 */
export function renderWithPrecision(
  x: number | undefined,
  digits: number,
  round = Math.round,
): string {
  if (x === undefined) return "?";
  const r = roundWithPrecision(x, digits, round);
  let rs = r.toLocaleString();
  if (digits > 0) {
    let doti = rs.indexOf(".");
    if (doti < 0) {
      rs += ".";
      doti = rs.length - 1;
    }
    while (rs.length - 1 - doti < digits) rs += "0";
  }
  return rs;
}
