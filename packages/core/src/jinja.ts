// Import the Template class from the @huggingface/jinja package
import { Template } from "@huggingface/jinja"

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
    return res
}
