"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file All rules
 */
const github_source_headers_js_1 = __importDefault(require("./github-source-headers.js"));
const ts_package_json_author_js_1 = __importDefault(require("./ts-package-json-author.js"));
const ts_package_json_bugs_js_1 = __importDefault(require("./ts-package-json-bugs.js"));
const ts_package_json_engine_is_present_js_1 = __importDefault(require("./ts-package-json-engine-is-present.js"));
const ts_package_json_homepage_js_1 = __importDefault(require("./ts-package-json-homepage.js"));
const ts_package_json_repo_js_1 = __importDefault(require("./ts-package-json-repo.js"));
const ts_versioning_semver_js_1 = __importDefault(require("./ts-versioning-semver.js"));
const ts_package_json_license_js_1 = __importDefault(require("./ts-package-json-license.js"));
/**
 * An object containing all rules defined by the plugin
 */
exports.default = {
    "github-source-headers": github_source_headers_js_1.default,
    "ts-package-json-author": ts_package_json_author_js_1.default,
    "ts-package-json-bugs": ts_package_json_bugs_js_1.default,
    "ts-package-json-engine-is-present": ts_package_json_engine_is_present_js_1.default,
    "ts-package-json-homepage": ts_package_json_homepage_js_1.default,
    "ts-package-json-license": ts_package_json_license_js_1.default,
    "ts-versioning-semver": ts_versioning_semver_js_1.default,
    "ts-package-json-repo": ts_package_json_repo_js_1.default,
};
//# sourceMappingURL=index.js.map