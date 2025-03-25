/**
 * Rounds a given number to a specified number of decimal places with optional rounding function.
 * 
 * @param x - The number to round. If undefined, NaN is returned.
 * @param digits - The number of decimal places to round to. If less than or equal to zero, the number is rounded to the nearest integer.
 * @param round - An optional rounding function to use (default is Math.round).
 * @returns The rounded number, or NaN if the input is undefined.
 */
export function roundWithPrecision(
    x: number | undefined,
    digits: number,
    round = Math.round
): number {
    if (x === undefined) return NaN
    digits = digits | 0
    // invalid digits input
    if (digits <= 0) return round(x)
    if (x === 0) return 0
    let r = 0
    while (r == 0 && digits < 21) {
        const d = Math.pow(10, digits++)
        r = round(x * d + Number.EPSILON) / d
    }
    return r
}

/**
 * Renders a number with specified precision and locale formatting.
 *
 * @param x - The number to be rendered.
 * @param digits - The number of decimal places to display.
 * @param round - Optional rounding function; defaults to Math.round.
 * @returns A string representation of the number formatted with the specified precision, or "?" if the input is undefined.
 */
export function renderWithPrecision(
    x: number | undefined,
    digits: number,
    round = Math.round
): string {
    if (x === undefined) return "?"
    const r = roundWithPrecision(x, digits, round)
    let rs = r.toLocaleString()
    if (digits > 0) {
        let doti = rs.indexOf(".")
        if (doti < 0) {
            rs += "."
            doti = rs.length - 1
        }
        while (rs.length - 1 - doti < digits) rs += "0"
    }
    return rs
}
