// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AddressInfo } from "net";

/**
 * Finds a random open port on the system.
 *
 * @returns A promise that resolves to an available port number.
 */
export async function findRandomOpenPort(): Promise<number> {
  const net = await import("net");
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const port = (server.address() as AddressInfo)?.port;
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
export async function isPortInUse(port: number): Promise<boolean> {
  const net = await import("net");
  return new Promise<boolean>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (err: { code?: string }) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        reject(err);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port);
  });
}
