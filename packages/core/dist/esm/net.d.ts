/**
 * Finds a random open port on the system.
 *
 * @returns A promise that resolves to an available port number.
 */
export declare function findRandomOpenPort(): Promise<number>;
/**
 * Checks if a specific port is in use.
 *
 * @param port The port number to check.
 * @returns A promise that resolves to true if the port is in use, or false otherwise.
 */
export declare function isPortInUse(port: number): Promise<boolean>;
//# sourceMappingURL=net.d.ts.map
