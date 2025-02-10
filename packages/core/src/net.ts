export function findRandomOpenPort() {
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
