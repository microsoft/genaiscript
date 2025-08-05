import type { ModelConnectionInfo } from "./models.js";
import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { ModelAliasesOptions, ModelOptions, PromptScript, WorkspaceFile } from "./types.js";
/**
 * Generates a configuration object for PromptFoo using a given script and options.
 *
 * @param script - The script containing prompt details, tests, and redteam configurations.
 *   - title: The title of the script.
 *   - id: The unique identifier of the script.
 *   - description: A detailed description of the script.
 *   - tests: Test cases or file paths for test data.
 *   - redteam: Optional redteam configurations.
 * @param options - Configuration options including:
 *   - chatInfo: Connection info and model aliases for chat models.
 *   - embeddingsInfo: Connection info for embedding models.
 *   - provider: The provider identifier.
 *   - out: Output directory or file path.
 *   - cli: CLI-specific settings.
 *   - redteam: Whether redteam configurations are enabled.
 *   - models: Array of model options and aliases.
 *   - trace: Trace options for debugging.
 *   - cancellation options: Options for handling cancellation.
 * @returns A configuration object for PromptFoo based on the provided script and options.
 */
export declare function generatePromptFooConfiguration(script: PromptScript, options: {
    chatInfo: ModelConnectionInfo & ModelAliasesOptions;
    embeddingsInfo?: ModelConnectionInfo;
    provider?: string;
    out?: string;
    cli?: string;
    redteam?: boolean;
    models?: (ModelOptions & ModelAliasesOptions)[];
} & TraceOptions & CancellationOptions): Promise<{
    description: string;
    prompts: string[];
    providers: {
        id: string;
        label: string;
        config: {
            model: string;
            smallModel: string;
            visionModel: string;
            temperature: number | Readonly<Pick<ModelOptions, "temperature" | "fallbackTools" | "reasoningEffort" | "model"> & {
                source: "cli" | "env" | "script" | "config" | "default";
                candidates?: string[];
            }>;
            top_p: number;
            cli: string;
        };
    }[];
    defaultTest: {
        transformVars: string;
        options: {
            transform: string;
            provider: {
                text: {
                    id: string;
                    config?: {
                        apiHost: string;
                    };
                };
                embedding: {
                    id: string;
                    config?: {
                        apiHost: string;
                    };
                };
            };
        };
    };
    target: {
        id: string;
        label: string;
    };
    redteam: {
        purpose: string;
        injectVar: string;
        numTests: number;
        plugins: string[];
        strategies: string[];
        language: string;
    };
    tests: {
        description: string;
        vars: {
            files: import("./types.js").ElementOrArray<string>;
            workspaceFiles: import("./types.js").ElementOrArray<WorkspaceFile>;
            vars: Record<string, string | number | boolean>;
        };
        options: {
            transform: string;
        };
        assert: ({
            type: string;
            value: string;
            transform: string;
        } | {
            transform: string;
            weight?: number;
            type: "contains-all" | "not-contains-all" | "contains-any" | "not-contains-any" | "icontains-all" | "not-icontains-all";
            value: string[];
        })[];
    }[];
}>;
//# sourceMappingURL=promptfoo.d.ts.map