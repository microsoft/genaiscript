"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRandomOpenPort = findRandomOpenPort;
exports.isPortInUse = isPortInUse;
/**
 * Finds a random open port on the system.
 *
 * @returns A promise that resolves to an available port number.
 */
async function findRandomOpenPort() {
    const net = await import("net");
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, () => {
            const port = server.address()?.port;
            server.close(() => resolve(port));
        });
    });
}
/**
 * Checks if a specific port is in use.
 *
 * @param port The port number to check.
 * @returns A promise that resolves to true if the port is in use, or false otherwise.
 */
async function isPortInUse(port) {
    const net = await import("net");
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                resolve(true);
            }
            else {
                reject(err);
            }
        });
        server.once("listening", () => {
            server.close(() => resolve(false));
        });
        server.listen(port);
    });
}
//# sourceMappingURL=net.js.map