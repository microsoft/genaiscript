// debug-otel.ts
import debug, { Debugger } from "debug"
import { consoleLogFormat } from "./logging"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("otel")

async function registerOTLPExporter() {
    const url = process.env.GENAISCRIPT_OPENTELEMETRY_COLLECTOR_URL
    dbg(`registering OTLP exporter at ${url}`)
    const { NodeTracerProvider, BatchSpanProcessor } = await import(
        "@opentelemetry/sdk-trace-node"
    )
    const { OTLPTraceExporter } = await import(
        "@opentelemetry/exporter-trace-otlp-http"
    )
    const collectorOptions = {
        url, // url is optional and can be omitted - default is http://localhost:4318/v1/traces
        headers: {},
        concurrencyLimit: 10,
    }
    const exporter = new OTLPTraceExporter(collectorOptions)
    const provider = new NodeTracerProvider({
        spanProcessors: [
            new BatchSpanProcessor(exporter, {
                // The maximum queue size. After the size is reached spans are dropped.
                maxQueueSize: 1000,
                // The interval between two consecutive exports
                scheduledDelayMillis: 30000,
            }),
        ],
    })
    provider.register()
}

async function instrumentDebug() {
    dbg(`instrumenting debug`)
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

export async function openTelemetryEnable() {
    dbg(`enabling OpenTelemetry`)
    await registerOTLPExporter()
    await instrumentDebug()
}
