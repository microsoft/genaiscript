// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { FlatConfig, SharedConfig } from "@typescript-eslint/utils/ts-eslint";
import n from "eslint-plugin-n";

const tsEslintCustomization: Record<string, SharedConfig.RuleEntry> = {
  "@typescript-eslint/no-invalid-this": "off",
  "@typescript-eslint/no-require-imports": "error",
  "@typescript-eslint/consistent-type-imports": "warn",
  "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: false }],
  "@typescript-eslint/explicit-module-boundary-types": ["error"],
  "@typescript-eslint/no-redeclare": ["error", { builtinGlobals: true }],
  "@typescript-eslint/camelcase": "off",
  "@typescript-eslint/naming-convention": [
    "error",
    { selector: "default", format: null },
    { selector: ["class", "interface"], format: ["PascalCase"] },
    {
      selector: "interface",
      format: ["PascalCase"],
      custom: {
        regex: "^I[A-Z]",
        match: false,
      },
    },
  ],
  "@typescript-eslint/no-angle-bracket-type-assertion": "off",
  "@typescript-eslint/no-array-constructor": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/explicit-function-return-type": [
    "warn",
    { allowExpressions: true, allowTypedFunctionExpressions: true },
  ],
  "@typescript-eslint/explicit-member-accessibility": "off",
  "@typescript-eslint/no-unsafe-member-access": "off",
  "@typescript-eslint/no-inferrable-types": "off",
  // We use empty extends and empty interface for shimming and renaming extensively
  "@typescript-eslint/no-empty-interface": "off",
  "@typescript-eslint/no-empty-object-type": "off",
  "@typescript-eslint/no-namespace": "error",
  "@typescript-eslint/no-non-null-assertion": "off",
  "@typescript-eslint/no-unused-vars": "off", // typescript compiler already checks this
  "@typescript-eslint/no-unused-expressions": "off",
  "@typescript-eslint/no-useless-constructor": "error",
  "@typescript-eslint/no-var-requires": "off",
  "@typescript-eslint/no-shadow": ["error", { ignoreTypeValueShadow: true }],
};

const genaiscriptDefault: Record<string, SharedConfig.RuleEntry> = {
  "@azure/azure-sdk/github-source-headers": "error",
  "@azure/azure-sdk/ts-package-json-author": "error",
  "@azure/azure-sdk/ts-package-json-bugs": "error",
  "@azure/azure-sdk/ts-package-json-engine-is-present": "error",
  "@azure/azure-sdk/ts-package-json-license": "error",
  "@azure/azure-sdk/ts-package-json-repo": "error",
};

const nCustomization = {
  name: "n-azsdk-customized",
  rules: {
    "n/exports-style": ["error", "module.exports"],
    "n/no-missing-import": "off",
    "n/no-missing-require": "off",
    "n/hashbang": "warn",
    "n/no-unsupported-features/node-builtins": "warn",
    "n/no-deprecated-api": "warn",
    "n/no-process-exit": "warn",
    "n/no-unpublished-import": "off",
    "n/no-unpublished-require": "off",
  },
};

function turnoffN(): Record<string, SharedConfig.RuleEntry> {
  const rules: Record<string, SharedConfig.RuleEntry> = {};
  for (const rule of Object.keys(n.rules ?? {})) {
    rules[`n/${rule}`] = "off";
  }
  return rules;
}

const nOffForBrowser = {
  files: ["**/browser/**/*.{ts,cts,mts}", "**/*.browser.{ts,cts,mts}", "**/*-browser.{ts,cts,mts}"],
  rules: turnoffN(),
};

const rules: Record<string, SharedConfig.RuleEntry> = {
  ...tsEslintCustomization,
  ...genaiscriptDefault,
};

export default (parser: FlatConfig.Parser): FlatConfig.ConfigArray => [
  {
    name: "@genaiscript/genaiscript/recommended-ts",
    files: ["**/*.ts", "**/*.cts", "**/*.mts", "**/*.tsx"],
    ignores: ["**/*.md/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
      },
    },
    rules,
    settings: {
      main: "src/index.ts",
    },
  },
  {
    name: "@genaiscript/genaiscript/recommended-json",
    files: ["*.json", "*/*/*.json"],
    ignores: ["**/*.md/*.json", "**/src/**/*.json", "**/test/**/*.json"],
    languageOptions: {
      parser,
      parserOptions: {
        project: ["../../../common/tools/eslint-plugin-azure-sdk/tsconfig.lintjson.json"],
        extraFileExtensions: [".json"],
      },
    },
    rules: {
      ...rules,
      "no-unused-expressions": "off",
    },
    settings: {
      main: "src/index.ts",
    },
  },
  n.configs["flat/recommended"],
  nCustomization as unknown as FlatConfig.Config,
  nOffForBrowser,
];
