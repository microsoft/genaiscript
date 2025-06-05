import { ModelConnectionInfo } from "./models.js";
import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
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
export declare function generatePromptFooConfiguration(
  script: PromptScript,
  options: {
    chatInfo: ModelConnectionInfo & ModelAliasesOptions;
    embeddingsInfo?: ModelConnectionInfo;
    provider?: string;
    out?: string;
    cli?: string;
    redteam?: boolean;
    models?: (ModelOptions & ModelAliasesOptions)[];
  } & TraceOptions &
    CancellationOptions,
): Promise<{
  description: string;
  prompts: string[];
  providers: {
    id: string;
    label: string;
    config: {
      model: string;
      smallModel: string;
      visionModel: string;
      temperature:
        | number
        | Readonly<
            Pick<ModelOptions, "model" | "temperature" | "reasoningEffort" | "fallbackTools"> & {
              source: "cli" | "env" | "script" | "config" | "default";
              candidates?: string[];
            }
          >;
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
    plugins: OptionsOrString<
      | "default"
      | "nist:ai:measure"
      | "owasp:llm"
      | "owasp:api"
      | "mitre:atlas"
      | "owasp:llm:01"
      | "owasp:llm:02"
      | "owasp:llm:04"
      | "owasp:llm:06"
      | "owasp:llm:09"
      | "contracts"
      | "divergent-repetition"
      | "excessive-agency"
      | "hallucination"
      | "harmful:chemical-biological-weapons"
      | "harmful:child-exploitation"
      | "harmful:copyright-violations"
      | "harmful:cybercrime"
      | "harmful:cybercrime:malicious-code"
      | "harmful:graphic-content"
      | "harmful:harassment-bullying"
      | "harmful:hate"
      | "harmful:illegal-activities"
      | "harmful:illegal-drugs"
      | "harmful:illegal-drugs:meth"
      | "harmful:indiscriminate-weapons"
      | "harmful:insults"
      | "harmful:intellectual-property"
      | "harmful:misinformation-disinformation"
      | "harmful:non-violent-crime"
      | "harmful:privacy"
      | "harmful:profanity"
      | "harmful:radicalization"
      | "harmful:self-harm"
      | "harmful:sex-crime"
      | "harmful:sexual-content"
      | "harmful:specialized-advice"
      | "harmful:unsafe-practices"
      | "harmful:violent-crime"
      | "harmful:weapons:ied"
      | "hijacking"
      | "pii:api-db"
      | "pii:direct"
      | "pii:session"
      | "pii:social"
      | "politics"
    >[];
    strategies: OptionsOrString<
      "base64" | "default" | "basic" | "jailbreak" | "jailbreak:composite" | "prompt-injection"
    >[];
    language: string;
  };
  tests: {
    description: string;
    vars: {
      files: ElementOrArray<string>;
      workspaceFiles: ElementOrArray<WorkspaceFile>;
      vars: Record<string, string | number | boolean>;
    };
    options: {
      transform: string;
    };
    assert: (
      | {
          type: string;
          value: string;
          transform: string;
        }
      | {
          transform: string;
          weight?: number;
          type:
            | "contains-all"
            | "not-contains-all"
            | "contains-any"
            | "not-contains-any"
            | "icontains-all"
            | "not-icontains-all";
          value: string[];
        }
    )[];
  }[];
}>;
//# sourceMappingURL=promptfoo.d.ts.map
