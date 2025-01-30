/**
 * This module provides functions for parsing and validating prompt scripts
 * within a project. It includes a Checker class for validation of various
 * data types and formats.
 */

import { Project } from "./server/messages"
import { BUILTIN_PREFIX, GENAI_ANY_REGEX, PROMPTY_REGEX } from "./constants"
import { errorMessage } from "./error"
import { host } from "./host"
import { JSON5TryParse } from "./json5"
import { humanize } from "inflection"
import { validateSchema } from "./schema"
import { promptyParse, promptyToGenAIScript } from "./prompty"

/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
function templateIdFromFileName(filename: string) {
    return filename
        .replace(/\.(mjs|ts|js|mts|prompty)$/i, "")
        .replace(/\.genai$/i, "")
        .replace(/.*[\/\\]/, "")
}

/**
 * Parses script metadata from the given JavaScript source.
 *
 * @param jsSource - The JavaScript source code of the script.
 * @returns A PromptArgs object containing the parsed metadata.
 */
export function parsePromptScriptMeta(
    jsSource: string
): PromptArgs & Pick<PromptScript, "defTools"> {
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(
        jsSource
    )
    const meta: PromptArgs & Pick<PromptScript, "defTools"> =
        JSON5TryParse(m?.groups?.meta) ?? {}
    if (m?.groups?.kind === "system") {
        meta.unlisted = true
        meta.isSystem = true
        meta.group = meta.group || "system"
    }
    meta.defTools = parsePromptScriptTools(jsSource)
    return meta
}

function parsePromptScriptTools(jsSource: string) {
    const tools: { id: string; description: string; kind: "tool" | "agent" }[] =
        []
    jsSource.replace(
        /def(?<kind>Tool|Agent)\s*\(\s*"(?<id>[^"]+?)"\s*,\s*"(?<description>[^"]+?)"/g,
        (m, kind, id, description) => {
            tools.push({
                id: kind === "Agent" ? "agent_" + id : id,
                description,
                kind: kind.toLocaleLowerCase(),
            })
            return ""
        }
    )
    return tools
}

/**
 * Core function to parse a prompt template and validate its contents.
 *
 * @param filename - The filename of the template.
 * @param content - The content of the template.
 * @param prj - The Project object containing diagnostics and other data.
 * @param finalizer - Finalizer function to perform additional validation.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
async function parsePromptTemplateCore(
    filename: string,
    content: string,
    prj: Project
) {
    const r = {
        id: templateIdFromFileName(filename),
        title: humanize(
            host.path.basename(filename).replace(GENAI_ANY_REGEX, "")
        ),
        jsSource: content,
    } as PromptScript
    if (!filename.startsWith(BUILTIN_PREFIX))
        r.filename = host.path.resolve(filename)
    const meta = parsePromptScriptMeta(r.jsSource)
    Object.assign(r, meta)
    return r
}

/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @param prj - The Project instance containing diagnostics.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
export async function parsePromptScript(
    filename: string,
    content: string,
    prj: Project
) {
    let text: string = undefined
    if (PROMPTY_REGEX.test(filename)) {
        text = content
        const doc = await promptyParse(filename, content)
        content = await promptyToGenAIScript(doc)
    }

    const script = await parsePromptTemplateCore(filename, content, prj)
    if (text) script.text = text
    return script
}
