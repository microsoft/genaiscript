import { performance, PerformanceObserver } from "perf_hooks"
import { logVerbose, toStringList } from "./util"

export function mark(id: string) {
    performance.mark(id)
}

export function measure(id: string, detail?: string) {
    const start = id + ".start"
    const end = id + ".end"
    performance.mark(start)
    return (endDetail?: string) => {
        performance.mark(end)
        performance.measure(
            `${id} ${toStringList(detail, endDetail)}`,
            start,
            end
        )
    }
}

export function logPerformance() {
    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            logVerbose(`perf> ${(entry.duration * 1000) | 0}ms: ${entry.name}`)
        })
    })
    perfObserver.observe({ entryTypes: ["measure"], buffered: true })
}
