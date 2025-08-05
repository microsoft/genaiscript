export declare let stdout: NodeJS.WriteStream;
export declare const stderr: NodeJS.WriteStream;
/**
 * Overrides the standard output stream with the standard error stream.
 *
 * No parameters are required for this function.
 * After execution, any output written to the standard output stream will
 * instead be redirected to the standard error stream.
 */
export declare function overrideStdoutWithStdErr(): void;
//# sourceMappingURL=stdio.d.ts.map