export function debounceAsync(
    handler: () => Promise<void>,
    delay: number
): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timeOutId: any
    let running = false
    let again = false // try to run while handler is running
    const res = function () {
        // try to run while handler is running
        if (timeOutId && running) {
            again = true
        }

        if (timeOutId && !running) {
            clearTimeout(timeOutId)
        }
        timeOutId = setTimeout(async () => {
            try {
                running = true
                await handler()
            } finally {
                running = false
                if (again) {
                    again = false
                    res()
                }
            }
        }, delay)
    }
    return res
}
