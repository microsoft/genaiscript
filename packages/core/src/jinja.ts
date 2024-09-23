import { Template } from "@huggingface/jinja"

export function jinjaRender(
    template: string,
    values: Record<string, any>
): string {
    const t = new Template(template)
    const res = t.render(values)
    return res
}
