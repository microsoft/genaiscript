/**
 * Defines a generalized way of reporting progress updates.
 */
export declare abstract class Progress {
    abstract report(value: {
        message?: string;
        count?: number;
        succeeded?: boolean | undefined;
    }): void;
    start(message: string, count?: number): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    stop(): void;
}
//# sourceMappingURL=progress.d.ts.map