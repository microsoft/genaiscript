/**
 * Finds a random open port on the host machine.
 * 
 * Creates a server, listens on an ephemeral port, retrieves the port number,
 * and then closes the server to free the port. Resolves with the port number.
 * 
 * @returns A promise that resolves to the open port number.
 * @throws An error if the server fails to start.
 */
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

/**
 * Checks if a specified port is currently in use.
 * 
 * This function attempts to create a TCP server on the given port. If the server encounters an error indicating
 * that the address is already in use, it resolves to true. If the server successfully starts listening, it closes
 * the server and resolves to false.
 * 
 * @param port - The port number to check for availability.
 * @returns A promise that resolves to a boolean indicating whether the port is in use.
 */
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
