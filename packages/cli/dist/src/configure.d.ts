/**
 * Configures a selected language model provider by updating the environment file
 * with necessary configuration parameters. Provides options to test or edit
 * configurations interactively via CLI prompts.
 *
 * @param options - Options object for configuration.
 * @param options.provider - The identifier of the provider to configure. If not provided, the user will be prompted to select one.
 *
 * The function guides the user through:
 * - Selecting a provider if not specified.
 * - Retrieving and displaying current configuration details.
 * - Testing the provider's configuration.
 * - Editing environment variables interactively. Supports secret values, enumerations, and basic validation.
 * - Patching the environment file with updated values.
 */
export declare function configure(options: {
    provider?: string;
}): Promise<void>;
//# sourceMappingURL=configure.d.ts.map