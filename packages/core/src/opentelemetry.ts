// debug-otel.ts
import debug, { Debugger } from "debug"
import { consoleLogFormat } from "./logging"
import { genaiscriptDebug } from "./debug"
import { TOOL_ID } from "./constants"
import { CORE_VERSION } from "./version"
import { setConsoleColors } from "./consolecolor"
import type { Context, Span, TraceAPI } from "@opentelemetry/api"
import type { ReadableSpan } from "@opentelemetry/sdk-trace-node"
const dbg = genaiscriptDebug("otel")

let _flush: () => Promise<void>
let _shutdown: () => Promise<void>
let _trace: TraceAPI

export async function openTelemetryRegister() {
    setConsoleColors(false)
    dbg(`registering`)

    const { trace, diag, DiagConsoleLogger, DiagLogLevel } = await import(
        "@opentelemetry/api"
    )
    const { NodeTracerProvider, SimpleSpanProcessor } = await import(
        "@opentelemetry/sdk-trace-node"
    )
    const { OTLPTraceExporter } = await import(
        "@opentelemetry/exporter-trace-otlp-http"
    )
    const { SeverityNumber } = await import("@opentelemetry/api-logs")
    const { OTLPLogExporter } = await import(
        "@opentelemetry/exporter-logs-otlp-http"
    )
    const { LoggerProvider, SimpleLogRecordProcessor } = await import(
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
    })
    loggerProvider.addLogRecordProcessor(
        new SimpleLogRecordProcessor(new OTLPLogExporter())
    )

    const tracerProvider = new NodeTracerProvider({
        resource,
        spanProcessors: [
            new SimpleSpanProcessor(new OTLPTraceExporter()),
            {
                forceFlush: async () => {
                    dbg(`span force flush`)
                },
                onStart: (_span: Span, _parentContext: Context) => {
                    dbg(`span start`)
                },
                onEnd: (span: ReadableSpan) => {
                    dbg(`span flags: ${span.spanContext().traceFlags}`)
                },
                shutdown: async () => {
                    dbg(`span shutdown`)
                },
            },
        ],
    })
    tracerProvider.register()
    _trace = trace
    _flush = async () => {
        dbg(`force flush`)
        try {
            await tracerProvider.forceFlush()
        } catch (e) {}
        try {
            await loggerProvider.forceFlush()
        } catch (e) {}
        dbg(`flushed`)
    }
    _shutdown = async () => {
        await loggerProvider.shutdown()
        await tracerProvider.shutdown()
        dbg(`shut down`)
    }

    /*
    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = function (...args: unknown[]) {
        // Call the original log so that debug continues to output as normal.
        originalLog(...args)

        // render
        const { namespace, diff } = this as any as Debugger
        const body = consoleLogFormat(args)

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
        */
    dbg(`enabled`)
}

export async function openTelemetryGetTracer(name: string, version?: string) {
    const tracer = _trace?.getTracer(name, version)
    return tracer
}

export async function openTelemetryFlush() {
    _flush?.()
}

export async function openTelemetryShutdown() {
    _trace = undefined
    _flush = undefined
    if (_shutdown) {
        const st = _shutdown
        _shutdown = undefined
        st()
    }
}
