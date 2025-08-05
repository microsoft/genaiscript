/**
 * Logs informational messages with optional color.
 * Combines string and number arguments into a single colored message if applicable.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export declare function info(...args: any[]): void;
/**
 * Logs debug messages with optional color.
 * Suppresses output if 'isQuiet' is true.
 * Utilizes console.error to print to stderr.
 * Combines arguments into a single message if they are strings or numbers.
 * @param args - The arguments to log
 */
export declare function debug(...args: any[]): void;
/**
 * Logs warning messages with optional color.
 * Combines string and number arguments into a single colored message if applicable.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
export declare function warn(...args: any[]): void;
/**
 * Logs error messages with optional color.
 * Utilizes console.error to print to stderr.
 * Combines string and number arguments into a single colored message if applicable.
 * @param args - The arguments to log
 */
export declare function error(...args: any[]): void;
//# sourceMappingURL=log.d.ts.map