// debug-otel.ts
import debug from "debug"

export async function openTelemetryEnable() {
    const { trace, context } = await import("@opentelemetry/api")

    // Save the original debug.log function
    const originalLog = debug.log.bind(debug)

    // Override the debug.log function to also send messages to OpenTelemetry
    debug.log = (...args: unknown[]) => {
        // Convert all arguments to a single string message.
        const message = args
            .map((arg) =>
                typeof arg === "object"
                    ? (() => {
                          try {
                              return JSON.stringify(arg)
                          } catch {
                              return String(arg)
                          }
                      })()
                    : String(arg)
            )
            .join(" ")

        // Get the current active span from the OpenTelemetry context
        const activeSpan = trace.getSpan(context.active())
        if (activeSpan) {
            // Add the debug message as an event on the active span.
            activeSpan.addEvent("debug", { message })
        }

        // Call the original log so that debug continues to output as normal.
        originalLog(...args)
    }
}
