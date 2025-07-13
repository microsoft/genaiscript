"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = __importDefault(require("@eslint/js"));
const typescript_eslint_1 = __importDefault(require("typescript-eslint"));
const eslint_config_prettier_1 = __importDefault(require("eslint-config-prettier"));
const eslint_plugin_promise_1 = __importDefault(require("eslint-plugin-promise"));
const eslint_customized_js_1 = __importDefault(require("./eslint-customized.js"));
const genaiscript_customized_js_1 = __importDefault(require("./genaiscript-customized.js"));
function recommended(plugin, options) {
    return typescript_eslint_1.default.config({
        ignores: ["**/generated/**", "**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    }, js_1.default.configs.recommended, ...(options.typeChecked
        ? typescript_eslint_1.default.configs.recommendedTypeChecked
        : typescript_eslint_1.default.configs.recommended), typescript_eslint_1.default.configs.eslintRecommended, eslint_config_prettier_1.default, {
        plugins: {
            "@azure/azure-sdk": plugin,
            promise: eslint_plugin_promise_1.default,
        },
    }, eslint_plugin_promise_1.default.configs["flat/recommended"], 
    // azure sdk customized
    eslint_customized_js_1.default, ...(0, genaiscript_customized_js_1.default)(typescript_eslint_1.default.parser));
}
const configExport = (plugin) => ({
    recommended: recommended(plugin, { typeChecked: false }),
    recommendedTypeChecked: recommended(plugin, { typeChecked: true }),
    internal: typescript_eslint_1.default.config({
        ignores: ["**/*.config.{js,cjs,mjs,ts,cts,mts}"],
    }, {
        languageOptions: {
            parser: typescript_eslint_1.default.parser,
            parserOptions: {
                projectService: true,
            },
        },
    }, js_1.default.configs.recommended, ...typescript_eslint_1.default.configs.recommended, typescript_eslint_1.default.configs.eslintRecommended, eslint_config_prettier_1.default, {
        plugins: {
            "@azure/azure-sdk": plugin,
        },
    }, {
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@azure/azure-sdk/github-source-headers": "off",
        },
    }),
});
exports.default = configExport;
//# sourceMappingURL=index.js.map