import { SERVER_PORT } from "../../core/src/constants"
import { findRandomOpenPort, isPortInUse } from "../../core/src/net"
import { logWarn } from "../../core/src/util"

export async function findOpenPort(
    defaultPort: number,
    options?: { port?: string }
) {
    let port = parseInt(options.port) || defaultPort
    if (await isPortInUse(port)) {
        if (options.port) throw new Error(`port ${port} in use`)
        const oldPort = port
        port = await findRandomOpenPort()
        logWarn(`port ${oldPort} in use, using port ${port}`)
    }
    return port
}
