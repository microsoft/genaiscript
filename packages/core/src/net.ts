export function findRandomOpenPort(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const server = require("net").createServer()
        server.unref()
        server.on("error", reject)
        server.listen(0, () => {
            const port = server.address().port
            server.close(() => resolve(port))
        })
    })
}

export function isPortInUse(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const server = require("net").createServer()
        server.once("error", (err: any) => {
            if (err.code === "EADDRINUSE") {
                resolve(true)
            } else {
                reject(err)
            }
        })
        server.once("listening", () => {
            server.close(() => resolve(false))
        })
        server.listen(port)
    })
}
