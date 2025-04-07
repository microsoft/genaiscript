// debug-otel.ts
import debug, { Debugger } from "debug"
import { consoleLogFormat } from "./logging"
import { genaiscriptDebug } from "./debug"
import { TOOL_ID } from "./constants"
import { CORE_VERSION } from "./version"
const dbg = genaiscriptDebug("otel")

let shutdown: () => Promise<void>

export async function openTelemetryRegister() {
    dbg(`enabling OpenTelemetry`)

    const { trace } = await import("@opentelemetry/api")
    const { NodeTracerProvider, BatchSpanProcessor } = await import(
        "@opentelemetry/sdk-trace-node"
    )
    const { OTLPTraceExporter } = await import(
        "@opentelemetry/exporter-trace-otlp-http"
    )
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
        "@opentelemetry/semantic-conventions"
    )
    const { resourceFromAttributes } = await import("@opentelemetry/resources")

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: TOOL_ID,
        [ATTR_SERVICE_VERSION]: CORE_VERSION,
    })
    // url: OTEL_EXPORTER_OTLP_ENDPOINT
    // timeout: OTEL_EXPORTER_OTLP_TIMEOUT
    const exporter = new OTLPTraceExporter()
    const provider = new NodeTracerProvider({
        resource,
        spanProcessors: [new BatchSpanProcessor(exporter)],
    })
    provider.register()
    const tracer = trace.getTracer(TOOL_ID, CORE_VERSION)
    shutdown = async () => {
        await provider.shutdown()
        shutdown = undefined
    }

    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = function (...args: unknown[]) {
        // Call the original log so that debug continues to output as normal.
        originalLog(...args)

        // send log to OpenTelemetry
        let span
        try {
            const { namespace, diff } = this as any as Debugger
            span = tracer.startSpan(namespace)
            const message = consoleLogFormat(args)
            span.addEvent("debug", {
                namespace,
                message,
                diff,
            })
        } finally {
            span.end()
        }
    }
    dbg(`OpenTelemetry enabled`)
}

export async function openTelemetryShutdown() {
    dbg(`shutting down OpenTelemetry`)
    shutdown?.()
    shutdown = undefined
}
