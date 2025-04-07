// debug-otel.ts
import debug, { Debugger } from "debug"
import { consoleLogFormat } from "./logging"
import { genaiscriptDebug } from "./debug"
import { TOOL_ID } from "./constants"
import { CORE_VERSION } from "./version"
import { setConsoleColors } from "./consolecolor"
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs"
const dbg = genaiscriptDebug("otel")

let _shutdown: () => Promise<void>

export async function openTelemetryRegister() {
    setConsoleColors(false)
    dbg(`enabling OpenTelemetry`)

    const { trace, diag, DiagConsoleLogger, DiagLogLevel } = await import(
        "@opentelemetry/api"
    )
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

    // Enable diagnostic logging
    if (process.env.OTEL_DEBUG)
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL)

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: TOOL_ID,
        [ATTR_SERVICE_VERSION]: CORE_VERSION,
    })
    const loggerProvider = new LoggerProvider({
        resource,
        forceFlushTimeoutMillis: 5000,
    })
    loggerProvider.addLogRecordProcessor(
        new SimpleLogRecordProcessor(new OTLPLogExporter())
    )

    const tracerProvider = new NodeTracerProvider({
        resource,
        spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
    })
    tracerProvider.register()
    _shutdown = async () => {
        dbg(`force flush`)
        await loggerProvider.shutdown()
        await tracerProvider.shutdown()
        dbg(`shut down`)
    }

    const tracer = trace.getTracer(TOOL_ID, CORE_VERSION)

    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = function (...args: unknown[]) {
        // Call the original log so that debug continues to output as normal.
        originalLog(...args)

        // render
        const { namespace, diff } = this as any as Debugger
        const body = consoleLogFormat(args)

        // create span
        /*
        const span = tracer.startSpan("genaiscript", {
            attributes: {
                namespace,
                body,
                diff,
            },
        })
        span.end()
        */

        // send logs
        const isGenaiscriptNamespace = /^genaiscript:/.test(namespace)
        const logger = loggerProvider.getLogger(
            isGenaiscriptNamespace ? "genaiscript" : namespace
        )
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
    if (_shutdown) {
        const st = _shutdown
        _shutdown = undefined
        st()
    }
}
