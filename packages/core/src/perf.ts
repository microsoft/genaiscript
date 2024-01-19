export function logMeasure(name: string, start: string, end: string) {
    performance.mark(end)
    const m = performance.measure(name, start, end)
    console.debug(`⏲️ ${m.name}: ${m.duration | 0}ms`)
}
