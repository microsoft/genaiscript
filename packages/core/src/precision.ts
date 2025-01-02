export function roundWithPrecision(
    x: number,
    digits: number,
    round = Math.round
): number {
    digits = digits | 0
    // invalid digits input
    if (digits <= 0) return round(x)
    if (x == 0) return 0
    let r = 0
    while (r == 0 && digits < 21) {
        const d = Math.pow(10, digits++)
        r = round(x * d + Number.EPSILON) / d
    }
    return r
}

export function renderWithPrecision(
    x: number,
    digits: number,
    round = Math.round
): string {
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
