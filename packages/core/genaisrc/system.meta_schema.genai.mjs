var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
system({
    title: "Tool that generate a valid schema for the described JSON",
    description: "OpenAI's meta schema generator from https://platform.openai.com/docs/guides/prompt-generation?context=structured-output-schema.",
});
var metaSchema = Object.freeze({
    name: "metaschema",
    schema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "The name of the schema",
            },
            type: {
                type: "string",
                enum: [
                    "object",
                    "array",
                    "string",
                    "number",
                    "boolean",
                    "null",
                ],
            },
            properties: {
                type: "object",
                additionalProperties: {
                    $ref: "#/$defs/schema_definition",
                },
            },
            items: {
                anyOf: [
                    {
                        $ref: "#/$defs/schema_definition",
                    },
                    {
                        type: "array",
                        items: {
                            $ref: "#/$defs/schema_definition",
                        },
                    },
                ],
            },
            required: {
                type: "array",
                items: {
                    type: "string",
                },
            },
            additionalProperties: {
                type: "boolean",
            },
        },
        required: ["type"],
        additionalProperties: false,
        if: {
            properties: {
                type: {
                    const: "object",
                },
            },
        },
        then: {
            required: ["properties"],
        },
        $defs: {
            schema_definition: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: [
                            "object",
                            "array",
                            "string",
                            "number",
                            "boolean",
                            "null",
                        ],
                    },
                    properties: {
                        type: "object",
                        additionalProperties: {
                            $ref: "#/$defs/schema_definition",
                        },
                    },
                    items: {
                        anyOf: [
                            {
                                $ref: "#/$defs/schema_definition",
                            },
                            {
                                type: "array",
                                items: {
                                    $ref: "#/$defs/schema_definition",
                                },
                            },
                        ],
                    },
                    required: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    additionalProperties: {
                        type: "boolean",
                    },
                },
                required: ["type"],
                additionalProperties: false,
                if: {
                    properties: {
                        type: {
                            const: "object",
                        },
                    },
                },
                then: {
                    required: ["properties"],
                },
            },
        },
    },
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    defTool("meta_schema", "Generate a valid JSON schema for the described JSON. Source https://platform.openai.com/docs/guides/prompt-generation?context=structured-output-schema.", {
        description: {
            type: "string",
            description: "Description of the JSON structure",
        },
    }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var res;
        var description = _b.description;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, runPrompt(function (_) {
                        _.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["# Instructions\nReturn a valid schema for the described JSON.\n\nYou must also make sure:\n- all fields in an object are set as required\n- I REPEAT, ALL FIELDS MUST BE MARKED AS REQUIRED\n- all objects must have additionalProperties set to false\n    - because of this, some cases like \"attributes\" or \"metadata\" properties that would normally allow additional properties should instead have a fixed set of properties\n- all objects must have properties defined\n- field order matters. any form of \"thinking\" or \"explanation\" should come before the conclusion\n- $defs must be defined under the schema param\n\nNotable keywords NOT supported include:\n- For strings: minLength, maxLength, pattern, format\n- For numbers: minimum, maximum, multipleOf\n- For objects: patternProperties, unevaluatedProperties, propertyNames, minProperties, maxProperties\n- For arrays: unevaluatedItems, contains, minContains, maxContains, minItems, maxItems, uniqueItems\n\nOther notes:\n- definitions and recursion are supported\n- only if necessary to include references e.g. \"$defs\", it must be inside the \"schema\" object\n\n# Examples\nInput: Generate a math reasoning schema with steps and a final answer.\nOutput: ", "\n\nInput: Give me a linked list\nOutput: ", "\n\nInput: Dynamically generated UI\nOutput: ", ""], ["# Instructions\nReturn a valid schema for the described JSON.\n\nYou must also make sure:\n- all fields in an object are set as required\n- I REPEAT, ALL FIELDS MUST BE MARKED AS REQUIRED\n- all objects must have additionalProperties set to false\n    - because of this, some cases like \"attributes\" or \"metadata\" properties that would normally allow additional properties should instead have a fixed set of properties\n- all objects must have properties defined\n- field order matters. any form of \"thinking\" or \"explanation\" should come before the conclusion\n- $defs must be defined under the schema param\n\nNotable keywords NOT supported include:\n- For strings: minLength, maxLength, pattern, format\n- For numbers: minimum, maximum, multipleOf\n- For objects: patternProperties, unevaluatedProperties, propertyNames, minProperties, maxProperties\n- For arrays: unevaluatedItems, contains, minContains, maxContains, minItems, maxItems, uniqueItems\n\nOther notes:\n- definitions and recursion are supported\n- only if necessary to include references e.g. \"$defs\", it must be inside the \"schema\" object\n\n# Examples\nInput: Generate a math reasoning schema with steps and a final answer.\nOutput: ", "\n\nInput: Give me a linked list\nOutput: ", "\n\nInput: Dynamically generated UI\nOutput: ", ""])), JSON.stringify({
                            name: "math_reasoning",
                            type: "object",
                            properties: {
                                steps: {
                                    type: "array",
                                    description: "A sequence of steps involved in solving the math problem.",
                                    items: {
                                        type: "object",
                                        properties: {
                                            explanation: {
                                                type: "string",
                                                description: "Description of the reasoning or method used in this step.",
                                            },
                                            output: {
                                                type: "string",
                                                description: "Result or outcome of this specific step.",
                                            },
                                        },
                                        required: ["explanation", "output"],
                                        additionalProperties: false,
                                    },
                                },
                                final_answer: {
                                    type: "string",
                                    description: "The final solution or answer to the math problem.",
                                },
                            },
                            required: ["steps", "final_answer"],
                            additionalProperties: false,
                        }), JSON.stringify({
                            name: "linked_list",
                            type: "object",
                            properties: {
                                linked_list: {
                                    $ref: "#/$defs/linked_list_node",
                                    description: "The head node of the linked list.",
                                },
                            },
                            $defs: {
                                linked_list_node: {
                                    type: "object",
                                    description: "Defines a node in a singly linked list.",
                                    properties: {
                                        value: {
                                            type: "number",
                                            description: "The value stored in this node.",
                                        },
                                        next: {
                                            anyOf: [
                                                {
                                                    $ref: "#/$defs/linked_list_node",
                                                },
                                                {
                                                    type: "null",
                                                },
                                            ],
                                            description: "Reference to the next node; null if it is the last node.",
                                        },
                                    },
                                    required: ["value", "next"],
                                    additionalProperties: false,
                                },
                            },
                            required: ["linked_list"],
                            additionalProperties: false,
                        }), JSON.stringify({
                            name: "ui",
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    description: "The type of the UI component",
                                    enum: [
                                        "div",
                                        "button",
                                        "header",
                                        "section",
                                        "field",
                                        "form",
                                    ],
                                },
                                label: {
                                    type: "string",
                                    description: "The label of the UI component, used for buttons or form fields",
                                },
                                children: {
                                    type: "array",
                                    description: "Nested UI components",
                                    items: {
                                        $ref: "#",
                                    },
                                },
                                attributes: {
                                    type: "array",
                                    description: "Arbitrary attributes for the UI component, suitable for any element",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: {
                                                type: "string",
                                                description: "The name of the attribute, for example onClick or className",
                                            },
                                            value: {
                                                type: "string",
                                                description: "The value of the attribute",
                                            },
                                        },
                                        required: ["name", "value"],
                                        additionalProperties: false,
                                    },
                                },
                            },
                            required: ["type", "label", "children", "attributes"],
                            additionalProperties: false,
                        }));
                        _.def("DESCRIPTION", description);
                    }, {
                        model: "large",
                        responseSchema: metaSchema,
                        responseType: "json_schema",
                        system: ["system.safety_jailbreak"],
                    })];
                case 1:
                    res = _c.sent();
                    return [2 /*return*/, res];
            }
        });
    }); });
}
var templateObject_1;
