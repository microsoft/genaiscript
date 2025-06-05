import { GenerationOptions } from "./generation.js";
import { MarkdownTrace } from "./trace.js";
/**
 * Generates command-line arguments for executing or batching a CLI prompt template.
 *
 * @param template - The prompt script template to execute.
 * @param options - The generation options to configure the CLI behavior.
 * @param command - The type of command to generate arguments for, either "run" or "batch".
 * @returns A string containing the constructed CLI command with arguments.
 *
 * Options in `options`:
 * - `model`: Specifies the AI model to use.
 * - `temperature`: Defines the randomness of the model's responses.
 * - `reasoningEffort`: Configures reasoning resource allocation.
 * - `fallbackTools`: Indicates whether fallback tools should be utilized.
 * - `topP`: Sets the nucleus sampling parameter for response generation.
 * - `seed`: Seed value for reproducible outputs.
 * - `cliInfo`: Contains additional CLI configuration, such as file lists.
 *
 * Note:
 * - File paths are converted to relative paths from the project folder.
 * - CLI utilizes the latest compatible version of the CLI package defined in constants.
 */
export declare function generateCliArguments(
  template: PromptScript,
  options: GenerationOptions,
  command: "run" | "batch",
): string;
/**
 * Generates detailed instructions for executing a template script and its tests using the command-line interface.
 *
 * @param trace - An object used for logging or recording detailed explanations and steps.
 * @param template - The template script being executed, containing metadata such as the script's ID and associated tests.
 * @param options - Configuration options for the generation, including model, temperature, and additional settings.
 *
 * The function logs:
 * - The CLI command for running the script using the `run` command.
 * - A note regarding environment dependencies, such as Node.js and `.env` file usage.
 * - If applicable, the CLI command for testing the template if associated tests are defined.
 */
export declare function traceCliArgs(
  trace: MarkdownTrace,
  template: PromptScript,
  options: GenerationOptions,
): void;
//# sourceMappingURL=clihelp.d.ts.map
