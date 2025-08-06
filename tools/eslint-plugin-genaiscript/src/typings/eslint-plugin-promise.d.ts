declare module 'eslint-plugin-promise' {
  import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    meta: FlatConfig.PluginMeta,
    plugin: FlatConfig.Plugin,
    configs: {
      "flat/recommended": FlatConfig.Config;
    };
  };
  export = exprt;
}
