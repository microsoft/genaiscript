import type { CancellationOptions, PromptScriptTestRunOptions, PromptScriptTestRunResponse } from "@genaiscript/core";
/**
 * Runs prompt script tests based on provided IDs and options, returns the test results.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run, including output paths, CLI settings, caching, verbosity, concurrency, redteam mode, promptfoo version, output summary, test delay, test timeout, max concurrency, and cancellation options.
 * @returns A Promise resolving to the test run response, including results, status, and error details if applicable.
 */
export declare function runPromptScriptTests(ids: string[], options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    maxConcurrency?: string;
    testTimeout?: string;
    random?: boolean;
    promptfoo?: boolean;
} & CancellationOptions): Promise<PromptScriptTestRunResponse>;
/**
 * Executes prompt script tests, outputs the results, and exits the process with a status code.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run, including output paths, CLI settings, verbosity, caching, test delay, groups, concurrency settings, and redteam mode.
 */
export declare function scriptsTest(ids: string[], options: PromptScriptTestRunOptions & {
    out?: string;
    cli?: string;
    removeOut?: boolean;
    cache?: boolean;
    verbose?: boolean;
    write?: boolean;
    redteam?: boolean;
    promptfooVersion?: string;
    outSummary?: string;
    testDelay?: string;
    groups?: string[];
    maxConcurrency?: string;
}): Promise<void>;
/**
 * Lists available test scripts and prints their IDs and filenames.
 * Filters the scripts based on the provided options.
 *
 * @param options - Options to filter the scripts by groups or redteam flag.
 * Filters the scripts by groups and whether they are for redteam testing.
 */
export declare function scriptTestList(options: {
    groups?: string[];
    redteam?: boolean;
}): Promise<void>;
/**
 * Launches a server to view promptfoo test results.
 * Ensures necessary directories are created before starting the server.
 * Logs a debug message before launching the server.
 * Executes the command to start the server using the specified or default promptfoo version.
 * @param options - Options to specify the promptfoo version.
 */
export declare function scriptTestsView(options: {
    promptfooVersion?: string;
}): Promise<void>;
//# sourceMappingURL=test.d.ts.map