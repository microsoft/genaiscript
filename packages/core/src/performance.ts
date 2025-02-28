import { performance, PerformanceObserver } from "perf_hooks"
import { logVerbose, toStringList } from "./util"
import prettyMilliseconds from "pretty-ms"

export function mark(id: string) {
    performance.mark(id)
}

export function measure(id: string, detail?: string) {
    const start = id + ".start"
    const end = id + ".end"
    const startm = performance.mark(start)
    return (endDetail?: string) => {
        const endm = performance.mark(end)
        performance.measure(
            `${id} ${toStringList(detail, endDetail)}`,
            start,
            end
        )
        return endm.startTime - startm.startTime
    }
}

export function logPerformance() {
    const measures: Record<string, number> = {}
    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            const total = (measures[entry.name] || 0) + entry.duration
            measures[entry.name] = total
            logVerbose(
                `perf> ${entry.name} ${prettyMilliseconds(entry.duration)}/${prettyMilliseconds(total)}`
            )
        })
    })
    perfObserver.observe({ entryTypes: ["measure"], buffered: true })
}
