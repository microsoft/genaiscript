"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptParameterTypeToJSONSchema = promptParameterTypeToJSONSchema;
exports.promptParametersSchemaToJSONSchema = promptParametersSchemaToJSONSchema;
const cleaners_js_1 = require("./cleaners.js");
function isJSONSchema(obj) {
    if (typeof obj === "object" && obj.type === "object")
        return true;
    if (typeof obj === "object" && obj.type === "array")
        return true;
    return false;
}
function isPromptParameterTypeRequired(t) {
    const ta = t;
    if (typeof t === "string" && t === "")
        return true;
    if (typeof t === "number" && isNaN(t))
        return true;
    return !!ta?.required;
}
/**
 * Converts a given prompt parameter type into its corresponding JSON Schema representation.
 *
 * @param t - The prompt parameter type or an array containing a single prompt parameter type.
 * @param options - Optional conversion options. Contains a flag to skip default values in schema generation.
 * @returns A JSON Schema representation of the provided prompt parameter type. Supports string, number, boolean, object, and array types.
 * @throws Will throw an error if the input type is not supported.
 */
function promptParameterTypeToJSONSchema(t, options) {
    const { noDefaults } = options || {};
    if (typeof t === "string")
        return (0, cleaners_js_1.deleteUndefinedValues)({
            type: "string",
            default: noDefaults || t === "" ? undefined : t,
        });
    else if (typeof t === "number")
        return (0, cleaners_js_1.deleteUndefinedValues)({
            type: Number.isInteger(t) ? "integer" : "number",
            default: noDefaults || isNaN(t) ? undefined : t,
        });
    else if (typeof t === "boolean")
        return (0, cleaners_js_1.deleteUndefinedValues)({
            type: "boolean",
            default: noDefaults ? undefined : t,
        });
    else if (Array.isArray(t))
        return {
            type: "array",
            items: promptParameterTypeToJSONSchema(t[0], options),
        };
    else if (typeof t === "object" &&
        ["number", "integer", "string", "boolean", "object"].includes(t.type)) {
        const { required, ...rest } = t;
        return { ...rest };
    }
    else if (typeof t === "object") {
        const o = {
            type: "object",
            properties: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, promptParameterTypeToJSONSchema(v, options)])),
            required: Object.entries(t)
                .filter(([, v]) => isPromptParameterTypeRequired(v))
                .map(([k]) => k),
        };
        return o;
    }
    else
        throw new Error(`prompt type ${typeof t} not supported`);
}
/**
 * Converts a PromptParametersSchema or JSONSchema into JSONSchema format.
 *
 * @param parameters - The parameters schema to be converted. Can be a PromptParametersSchema, a JSONSchema, or undefined. If undefined, returns undefined.
 * @param options - Optional conversion options which may include whether to exclude default values.
 * @returns A JSONSchema object or undefined if the input parameters are undefined.
 */
function promptParametersSchemaToJSONSchema(parameters, options) {
    if (!parameters)
        return undefined;
    if (isJSONSchema(parameters))
        return parameters;
    const res = {
        type: "object",
        properties: {},
        required: [],
    };
    for (const [k, v] of Object.entries(parameters)) {
        const t = promptParameterTypeToJSONSchema(v, options);
        const required = isPromptParameterTypeRequired(v);
        res.properties[k] = t;
        if (t.type !== "object" && t.type !== "array" && required)
            res.required.push(k);
    }
    return res;
}
//# sourceMappingURL=parameters.js.map