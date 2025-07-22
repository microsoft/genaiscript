// This module defines a system tool that applies OpenAI's meta prompt guidelines to a user-provided prompt.
// The tool refines a given prompt to create a detailed system prompt designed to guide a language model for task completion.
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
    // Metadata for the tool
    title: "Tool that applies OpenAI's meta prompt guidelines to a user prompt",
    description: "Modified meta-prompt tool from https://platform.openai.com/docs/guides/prompt-generation?context=text-out.",
});
export default function (ctx) {
    var _this = this;
    var defTool = ctx.defTool;
    // Define the 'meta_prompt' tool with its properties and functionality
    defTool("meta_prompt", "Tool that applies OpenAI's meta prompt guidelines to a user prompt. Modified from https://platform.openai.com/docs/guides/prompt-generation?context=text-out.", {
        // Input parameter for the tool
        prompt: {
            type: "string",
            description: "User prompt to be converted to a detailed system prompt using OpenAI's meta prompt guidelines",
        },
    }, 
    // Asynchronous function that processes the user prompt
    function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var res;
        var _c;
        var userPrompt = _b.prompt, context = _b.context;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, runPrompt(function (_) {
                        _.$(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Given a task description or existing prompt in USER_PROMPT, produce a detailed system prompt to guide a language model in completing the task effectively.\n\n# Guidelines\n\n- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.\n- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.\n- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!\n    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.\n    - Conclusion, classifications, or results should ALWAYS appear last.\n- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.\n   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.\n- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.\n- Formatting: Use markdown features for readability.\n- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.\n- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.\n- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, YAML, INI, CSV, JSON, etc.)\n    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a YAML.\n\nThe final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no \"---\")\n\n[Concise instruction describing the task - this should be the first line in the prompt, no section header]\n\n[Additional details as needed.]\n\n[Optional sections with headings or bullet points for detailed steps.]\n\n# Steps [optional]\n\n[optional: a detailed breakdown of the steps necessary to accomplish the task]\n\n# Output Format\n\n[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]\n\n# Examples [optional]\n\n[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]\n[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]\n\n# Notes [optional]\n\n[optional: edge cases, details, and an area to call or repeat out specific important considerations]"], ["Given a task description or existing prompt in USER_PROMPT, produce a detailed system prompt to guide a language model in completing the task effectively.\n\n# Guidelines\n\n- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.\n- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.\n- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!\n    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.\n    - Conclusion, classifications, or results should ALWAYS appear last.\n- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.\n   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.\n- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.\n- Formatting: Use markdown features for readability.\n- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.\n- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.\n- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, YAML, INI, CSV, JSON, etc.)\n    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a YAML.\n\nThe final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no \"---\")\n\n[Concise instruction describing the task - this should be the first line in the prompt, no section header]\n\n[Additional details as needed.]\n\n[Optional sections with headings or bullet points for detailed steps.]\n\n# Steps [optional]\n\n[optional: a detailed breakdown of the steps necessary to accomplish the task]\n\n# Output Format\n\n[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]\n\n# Examples [optional]\n\n[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]\n[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]\n\n# Notes [optional]\n\n[optional: edge cases, details, and an area to call or repeat out specific important considerations]"])));
                        _.def("USER_PROMPT", userPrompt);
                    }, {
                        // Specify the model to be used
                        model: "large",
                        // Label for the prompt run
                        label: "meta-prompt",
                        // System configuration, including safety mechanisms
                        system: ["system.safety_jailbreak"],
                    })
                    // Log the result or any errors for debugging purposes
                ];
                case 1:
                    res = _d.sent();
                    // Log the result or any errors for debugging purposes
                    context.debug(String((_c = res.text) !== null && _c !== void 0 ? _c : res.error));
                    return [2 /*return*/, res];
            }
        });
    }); });
}
var templateObject_1;
