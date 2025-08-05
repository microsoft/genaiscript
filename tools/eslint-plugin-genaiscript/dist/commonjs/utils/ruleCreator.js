"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const utils_1 = require("@typescript-eslint/utils");
exports.createRule = utils_1.ESLintUtils.RuleCreator((name) => `https://github.com/Microsoft/genaiscript/tree/dev/tools/eslint-plugin-genaiscript/docs/rules/${name}.md`);
//# sourceMappingURL=ruleCreator.js.map