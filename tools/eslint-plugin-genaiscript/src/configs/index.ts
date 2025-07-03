// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import eslint from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import type { ConfigArray } from "typescript-eslint";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import promise from "eslint-plugin-promise";

import eslintCustomized from "./eslint-customized.js";
import genaiScriptCustomized from "./genaiscript-customized.js";

function recommended(plugin: FlatConfig.Plugin, options: { typeChecked: boolean }) {
  return typescriptEslint.config(
    {
      ignores: ["**/generated/**", "**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    },
    eslint.configs.recommended,
    ...(options.typeChecked
      ? typescriptEslint.configs.recommendedTypeChecked
      : typescriptEslint.configs.recommended),
    typescriptEslint.configs.eslintRecommended,
    eslintConfigPrettier,
    {
      plugins: {
        "@azure/azure-sdk": plugin,
        promise,
      },
    },

    promise.configs["flat/recommended"],

    // azure sdk customized
    eslintCustomized,
    ...genaiScriptCustomized(typescriptEslint.parser),
  );
}

type ConfigExport = {
  recommended: FlatConfig.ConfigArray;
  recommendedTypeChecked: FlatConfig.ConfigArray;
  internal: ConfigArray;
};

const configExport: (plugin: FlatConfig.Plugin) => ConfigExport = (plugin) => ({
  recommended: recommended(plugin, { typeChecked: false }),
  recommendedTypeChecked: recommended(plugin, { typeChecked: true }),
  internal: typescriptEslint.config(
    {
      ignores: ["**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    },
    {
      languageOptions: {
        parser: typescriptEslint.parser,
        parserOptions: {
          projectService: true,
        },
      },
    },
    eslint.configs.recommended,
    ...typescriptEslint.configs.recommended,
    typescriptEslint.configs.eslintRecommended,
    eslintConfigPrettier,
    {
      plugins: {
        "@azure/azure-sdk": plugin,
      },
    },
    {
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "@azure/azure-sdk/github-source-headers": "warn",
      },
    },
  ),
});

export default configExport;
