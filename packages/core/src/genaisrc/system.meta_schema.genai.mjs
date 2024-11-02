system({
    title: "Tool that generate a valid schema for the described JSON",
    description:
        "OpenAI's meta schema generator from https://platform.openai.com/docs/guides/prompt-generation?context=structured-output-schema.",
})

const metaSchema = Object.freeze({
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
})

defTool(
    "meta_schema",
    "Generate a valid JSON schema for the described JSON. Source https://platform.openai.com/docs/guides/prompt-generation?context=structured-output-schema.",
    {
        description: {
            type: "string",
            description: "Description of the JSON structure",
        },
    },
    async ({ description }) => {
        const res = await runPrompt(
            (_) => {
                _.$`# Instructions
Return a valid schema for the described JSON.

You must also make sure:
- all fields in an object are set as required
- I REPEAT, ALL FIELDS MUST BE MARKED AS REQUIRED
- all objects must have additionalProperties set to false
    - because of this, some cases like "attributes" or "metadata" properties that would normally allow additional properties should instead have a fixed set of properties
- all objects must have properties defined
- field order matters. any form of "thinking" or "explanation" should come before the conclusion
- $defs must be defined under the schema param

Notable keywords NOT supported include:
- For strings: minLength, maxLength, pattern, format
- For numbers: minimum, maximum, multipleOf
- For objects: patternProperties, unevaluatedProperties, propertyNames, minProperties, maxProperties
- For arrays: unevaluatedItems, contains, minContains, maxContains, minItems, maxItems, uniqueItems

Other notes:
- definitions and recursion are supported
- only if necessary to include references e.g. "$defs", it must be inside the "schema" object

# Examples
Input: Generate a math reasoning schema with steps and a final answer.
Output: ${JSON.stringify({
                    name: "math_reasoning",
                    type: "object",
                    properties: {
                        steps: {
                            type: "array",
                            description:
                                "A sequence of steps involved in solving the math problem.",
                            items: {
                                type: "object",
                                properties: {
                                    explanation: {
                                        type: "string",
                                        description:
                                            "Description of the reasoning or method used in this step.",
                                    },
                                    output: {
                                        type: "string",
                                        description:
                                            "Result or outcome of this specific step.",
                                    },
                                },
                                required: ["explanation", "output"],
                                additionalProperties: false,
                            },
                        },
                        final_answer: {
                            type: "string",
                            description:
                                "The final solution or answer to the math problem.",
                        },
                    },
                    required: ["steps", "final_answer"],
                    additionalProperties: false,
                })}

Input: Give me a linked list
Output: ${JSON.stringify({
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
                            description:
                                "Defines a node in a singly linked list.",
                            properties: {
                                value: {
                                    type: "number",
                                    description:
                                        "The value stored in this node.",
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
                                    description:
                                        "Reference to the next node; null if it is the last node.",
                                },
                            },
                            required: ["value", "next"],
                            additionalProperties: false,
                        },
                    },
                    required: ["linked_list"],
                    additionalProperties: false,
                })}

Input: Dynamically generated UI
Output: ${JSON.stringify({
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
                            description:
                                "The label of the UI component, used for buttons or form fields",
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
                            description:
                                "Arbitrary attributes for the UI component, suitable for any element",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        description:
                                            "The name of the attribute, for example onClick or className",
                                    },
                                    value: {
                                        type: "string",
                                        description:
                                            "The value of the attribute",
                                    },
                                },
                                required: ["name", "value"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["type", "label", "children", "attributes"],
                    additionalProperties: false,
                })}`
                _.def("DESCRIPTION", description)
            },
            {
                model: "large",
                responseSchema: metaSchema,
                responseType: "json_schema",
                system: ["system.safety_jailbreak"],
            }
        )
        return res
    }
)
