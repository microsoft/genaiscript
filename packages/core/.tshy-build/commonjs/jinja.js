"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.jinjaRender = jinjaRender;
exports.jinjaRenderChatMessage = jinjaRenderChatMessage;
// Import the Template class from the @huggingface/jinja package
const jinja_1 = require("@huggingface/jinja");
const util_js_1 = require("./util.js");
/**
 * Renders a string template using the Jinja templating engine.
 *
 * This function takes a Jinja template string and an object containing
 * key-value pairs. It uses the Jinja engine to replace placeholders
 * in the template with the corresponding values from the object.
 *
 * @param template - The string containing Jinja template syntax.
 * @param values - An object with key-value pairs to replace in the template.
 * @returns The rendered string with values substituted.
 */
function jinjaRender(template, values) {
    // Create a new Template instance with the provided template string
    const t = new jinja_1.Template(template);
    // Render the template using the provided values
    const res = t.render(values);
    // Return the rendered string
    return (0, util_js_1.collapseEmptyLines)(res);
}
/**
 * Renders a chat message using Jinja template syntax.
 *
 * This function processes a chat message object and renders its content
 * using provided arguments. The content can include text, image URLs,
 * or refusal messages, which are formatted into a Jinja-compatible
 * template string before substitution.
 *
 * @param msg - The chat message object containing the content to render.
 *   If the content is a string, it is used directly; otherwise, its
 *   components are processed based on their type.
 * @param args - A key-value mapping of arguments to replace the placeholders
 *   within the Jinja template derived from the chat message content.
 * @returns The rendered string with the placeholders substituted using the
 *   provided arguments.
 */
function jinjaRenderChatMessage(msg, args) {
    const { content } = msg;
    const template = [];
    if (typeof content === "string")
        template.push(content);
    else
        for (const part of content) {
            if (part.type === "text")
                template.push(part.text);
            else if (part.type === "image_url")
                template.push(`![](${part.image_url})`);
            else if (part.type === "refusal")
                template.push(`refusal: ${part.refusal}`);
        }
    return jinjaRender(template.join("\n"), args);
}
//# sourceMappingURL=jinja.js.map