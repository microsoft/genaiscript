import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
declare function config(customConfigs?: FlatConfig.ConfigArray): FlatConfig.Config[];
declare const _default: {
    configs: {
        recommended: FlatConfig.ConfigArray;
        recommendedTypeChecked: FlatConfig.ConfigArray;
        internal: import("typescript-eslint").ConfigArray;
    };
    config: typeof config;
    meta?: { [K in keyof FlatConfig.PluginMeta]?: FlatConfig.PluginMeta[K] | undefined; };
    processors?: Partial<Record<string, FlatConfig.Processor>> | undefined;
    rules?: Record<string, import("@typescript-eslint/utils/ts-eslint").LooseRuleDefinition> | undefined;
};
export default _default;
//# sourceMappingURL=index.d.ts.map