import type { LanguageModel } from "./chat.js";
/**
 * Resolves and returns a language model based on the provided model provider identifier.
 *
 * @param provider - The identifier of the model provider. It determines which language model to return.
 *                   Supported providers include predefined constants from "./constants".
 *
 * @returns The resolved language model instance corresponding to the specified provider.
 *
 * @throws An error if the provider is MODEL_PROVIDER_GITHUB_COPILOT_CHAT and no client language model is available.
 *         If the provider does not match any predefined constant, a LocalOpenAICompatibleModel is returned with
 *         features derived from the MODEL_PROVIDERS configuration.
 */
export declare function resolveLanguageModel(provider: string): LanguageModel;
//# sourceMappingURL=lm.d.ts.map