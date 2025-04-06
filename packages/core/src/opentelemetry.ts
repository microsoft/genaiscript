// debug-otel.ts
import debug, { Debugger } from "debug"
import { consoleLogFormat } from "./logging"

export async function openTelemetryEnable() {
    const { trace, context } = await import("@opentelemetry/api")

    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = function (...args: unknown[]) {
        // Call the original log so that debug continues to output as normal.
        originalLog(...args)

        // send log to OpenTelemetry
        const activeSpan = trace.getSpan(context.active())
        if (activeSpan) {
            const _this = this as any as Debugger
            const { namespace, diff } = _this
            const message = consoleLogFormat(args)
            activeSpan.addEvent("debug", {
                namespace,
                message,
                diff,
            })
        }
    }
}
