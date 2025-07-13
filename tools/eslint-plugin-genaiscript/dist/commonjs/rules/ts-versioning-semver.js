"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to force adherence to SemVer guidelines.
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-versioning-semver",
    meta: {
        type: "suggestion",
        docs: {
            description: "force adherence to SemVer guidelines",
        },
        messages: {
            ...verifiers_js_1.VerifierMessages,
            versionNotString: "version is not set to a string",
            versionNotSemver: "version does not follow semver regex",
            majorNotZero: "major should not be zero",
            unrecognizedPrerelease: "unrecognized prerelease tag: {{value}}",
            prereleaseBadFormat: "{{prereleaseName}} format is not {{expectedFormat}}",
        },
        schema: [],
        fixable: "code",
    },
    defaultOptions: [],
    create(context) {
        const verifiers = (0, verifiers_js_1.getVerifiers)(context, {
            outer: "version",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // callback functions
            // check to see if version exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check the node corresponding to types to see if its value is a TypeScript declaration file
            "ExpressionStatement > ObjectExpression > Property[key.value='version']": (node) => {
                if (node.value.type !== "Literal") {
                    context.report({
                        node: node.value,
                        messageId: "versionNotString",
                    });
                    return;
                }
                const nodeValue = node.value;
                const version = nodeValue.value;
                // check for violations specific to semver
                const versionMatch = version.match(/^(0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(.+)|$)/);
                if (versionMatch === null) {
                    context.report({
                        node: nodeValue,
                        messageId: "versionNotSemver",
                    });
                    return;
                }
                const majorVersionNumber = versionMatch[1];
                if (majorVersionNumber === "0") {
                    context.report({
                        node: nodeValue,
                        messageId: "majorNotZero",
                    });
                }
                // check that if alpha or beta is in proper syntax if provided
                const secondPart = versionMatch[2];
                if (secondPart === undefined) {
                    return;
                }
                const ver = secondPart.match(/^(alpha|beta)(.*)/);
                if (ver === null) {
                    context.report({
                        node: nodeValue,
                        messageId: "unrecognizedPrerelease",
                        data: { value: secondPart },
                    });
                    return;
                }
                const prereleaseName = ver[1];
                const prereleaseNumber = ver[2];
                if (prereleaseName === "beta" && !/^\.(:?0|(?:[1-9]\d*))$/.test(prereleaseNumber)) {
                    context.report({
                        node: nodeValue,
                        messageId: "prereleaseBadFormat",
                        data: { prereleaseName, expectedFormat: "x.y.z-beta.i" },
                    });
                    return;
                }
                if (prereleaseName === "alpha" &&
                    !/^\.[2-9]\d\d\d[0-1]\d[0-3]\d\.(:?0|(?:[1-9]\d*))$/.test(prereleaseNumber)) {
                    context.report({
                        node: nodeValue,
                        messageId: "prereleaseBadFormat",
                        data: { prereleaseName, expectedFormat: "x.y.z-${prereleaseName}.<date>.i" },
                    });
                    return;
                }
            },
        };
    },
});
//# sourceMappingURL=ts-versioning-semver.js.map