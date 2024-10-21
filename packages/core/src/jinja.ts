// Import the Template class from the @huggingface/jinja package
import { Template } from "@huggingface/jinja"
import { ChatCompletionMessageParam } from "./chattypes"
import { collapseEmptyLines } from "./util"

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
export function jinjaRender(
    template: string,
    values: Record<string, any>
): string {
    // Create a new Template instance with the provided template string
    const t = new Template(template)

    // Render the template using the provided values
    const res = t.render(values)

    // Return the rendered string
    return collapseEmptyLines(res)
}

export function jinjaRenderChatMessage(
    msg: ChatCompletionMessageParam,
    args: Record<string, any>
) {
    const { content } = msg
    let template: string[] = []
    if (typeof content === "string") template.push(content)
    else
        for (const part of content) {
            if (part.type === "text") template.push(part.text)
            else if (part.type === "image_url")
                template.push(`![](${part.image_url})`)
            else if (part.type === "refusal")
                template.push(`refusal: ${part.refusal}`)
        }
    return jinjaRender(template.join("\n"), args)
}
