"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateTestResult = evaluateTestResult;
const cleaners_js_1 = require("./cleaners.js");
const debug_js_1 = require("./debug.js");
const groq_js_1 = require("./groq.js");
const levenshtein_js_1 = require("./levenshtein.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("tests:eval");
async function evaluateTestResult(config, result) {
    const { script, test } = config;
    const { id } = script;
    const { status, error, text } = result;
    dbg(`evaluating test: %s %s`, id, test.description);
    if (error) {
        dbg(`error: %O`, error);
        return `error: ${error.message}`;
    }
    if (status !== "success") {
        dbg(`status: %s`, status);
        return status;
    }
    const { keywords, forbidden, asserts } = test;
    const upperText = text.toLocaleUpperCase();
    // keywords
    for (const keyword of (0, cleaners_js_1.arrayify)(keywords)) {
        if (!upperText.includes(keyword.toLocaleUpperCase())) {
            return `keyword '${keyword}' not found in output`;
        }
    }
    // forbidden
    for (const keyword of (0, cleaners_js_1.arrayify)(forbidden)) {
        if (upperText.includes(keyword.toLocaleUpperCase())) {
            return `forbidden keyword '${keyword}' found in output`;
        }
    }
    for (const assert of (0, cleaners_js_1.arrayify)(asserts)) {
        const { type, transform } = assert;
        const transformedText = transform ? "" + (await (0, groq_js_1.GROQEvaluate)(text, result)) : text; // TODO: implement actual transformation
        const transformedUpperText = transformedText.toLocaleUpperCase();
        // Handle different assertion types
        let passed = false;
        switch (type) {
            case "icontains": {
                const { value } = assert;
                passed = transformedUpperText.includes(value.toLocaleUpperCase());
                break;
            }
            case "not-icontains": {
                const { value } = assert;
                passed = !transformedUpperText.includes(value.toLocaleUpperCase());
                break;
            }
            case "equals": {
                const { value } = assert;
                passed = transformedText === value;
                break;
            }
            case "not-equals": {
                const { value } = assert;
                passed = transformedText !== value;
                break;
            }
            case "starts-with": {
                const { value } = assert;
                passed = transformedText.startsWith(value);
                break;
            }
            case "not-starts-with": {
                const { value } = assert;
                passed = !transformedText.startsWith(value);
                break;
            }
            case "contains-all": {
                const { value } = assert;
                passed = (0, cleaners_js_1.arrayify)(value).every((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "not-contains-all": {
                const { value } = assert;
                passed = !(0, cleaners_js_1.arrayify)(value).every((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "contains-any": {
                const { value } = assert;
                passed = (0, cleaners_js_1.arrayify)(value).some((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "not-contains-any": {
                const { value } = assert;
                passed = !(0, cleaners_js_1.arrayify)(value).some((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "icontains-all": {
                const { value } = assert;
                passed = (0, cleaners_js_1.arrayify)(value).every((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "not-icontains-all": {
                const { value } = assert;
                passed = !(0, cleaners_js_1.arrayify)(value).every((v) => transformedUpperText.includes(v.toLocaleUpperCase()));
                break;
            }
            case "levenshtein": {
                const { value, threshold } = assert;
                const dist = await (0, levenshtein_js_1.levenshteinDistance)(transformedText, value);
                const maxThreshold = threshold ?? 3; // Default threshold
                passed = dist <= maxThreshold;
                break;
            }
            case "not-levenshtein": {
                const { value, threshold } = assert;
                const dist = await (0, levenshtein_js_1.levenshteinDistance)(transformedText, value);
                const maxThreshold = threshold ?? 3; // Default threshold
                passed = dist > maxThreshold;
                break;
            }
            default:
                dbg(`unknown assertion type: ${type}`);
                return `unknown assertion type: ${type}`;
        }
        if (!passed) {
            const value = assert.value;
            const assertionDesc = Array.isArray(value)
                ? `${type}([${value.join(", ")}])`
                : `${type}('${value}')`;
            return `assertion failed: ${assertionDesc}`;
        }
    }
    dbg(`test passed`);
    return undefined; // Test passed, no error message
}
//# sourceMappingURL=testeval.js.map