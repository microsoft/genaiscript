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
    const { SeverityNumber } = await import("@opentelemetry/api-logs")
    const { OTLPLogExporter } = await import(
        "@opentelemetry/exporter-logs-otlp-http"
    )
    const { LoggerProvider, BatchLogRecordProcessor } = await import(
        "@opentelemetry/sdk-logs"
    )
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
        "@opentelemetry/semantic-conventions"
    )
    const { resourceFromAttributes } = await import("@opentelemetry/resources")

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: TOOL_ID,
        [ATTR_SERVICE_VERSION]: CORE_VERSION,
    })
    const loggerProvider = new LoggerProvider({
        resource,
    })
    loggerProvider.addLogRecordProcessor(
        new BatchLogRecordProcessor(new OTLPLogExporter())
    )

    const tracerProvider = new NodeTracerProvider({
        resource,
        spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
    })
    tracerProvider.register()
    shutdown = async () => {
        await loggerProvider.shutdown()
        await tracerProvider.shutdown()
        shutdown = undefined
    }

    const tracer = trace.getTracer(TOOL_ID, CORE_VERSION)

    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = function (...args: unknown[]) {
        // Call the original log so that debug continues to output as normal.
        originalLog(...args)

        // render
        const body = consoleLogFormat(args)

        // send log to OpenTelemetry
        const { namespace, diff } = this as any as Debugger
        const logger = loggerProvider.getLogger(namespace)
        const isGenaiscriptNamespace = /^genaiscript:/.test(namespace)
        logger.emit({
            body,
            severityNumber: isGenaiscriptNamespace
                ? SeverityNumber.DEBUG
                : SeverityNumber.INFO,
            severityText: isGenaiscriptNamespace ? "DEBUG" : "INFO",
            attributes: {
                diff,
            },
        })
    }
    dbg(`OpenTelemetry enabled`)
}

export async function openTelemetryShutdown() {
    dbg(`shutting down OpenTelemetry`)
    shutdown?.()
    shutdown = undefined
}
