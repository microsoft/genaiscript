import {
    ChatCompletionsOptions,
    RequestError,
    getChatCompletions,
} from "./chat"
import { Fragment, PromptTemplate, eofPosition, rangeOfFragments } from "./ast"
import { Edits } from "./edits"
import { commentAttributes, stringToPos } from "./parser"
import {
    assert,
    concatArrays,
    fileExists,
    readText,
    relativePath,
} from "./util"
import { evalPrompt, extractFenced, removeFence, staticVars } from "./template"
import { host } from "./host"
import { inspect } from "./logging"

const defaultModel = "gpt-4"
const defaultTemperature = 0.2 // 0.0-2.0, defaults to 1.0
const defaultMaxTokens = 800

export interface FragmentTransformResponse {
    /**
     * Zero or more edits to apply.
     */
    edits: Edits[]

    /**
     * MD-formatted trace.
     */
    info: string

    /**
     * LLM output.
     */
    text: string

    /**
     * MD-formatted text to show user if any.
     */
    dialogText?: string
}

// 'foo.bar.baz' -> [ 'foo', 'foo.bar', 'foo.bar.baz' ]
function prefixes(w: string) {
    const words = w.split(".")
    return words.map((_, i) => words.slice(0, i + 1).join("."))
}

function trimNewlines(s: string) {
    return s.replace(/^\n*/, "").replace(/\n*$/, "")
}
const fence = "`````"
function fenceMD(t: string, contentType = "markdown") {
    return `\n${fence}${contentType}\n${trimNewlines(t)}\n${fence}\n`
}
function numberedFenceMD(t: string, contentType = "js") {
    return fenceMD(
        t
            .split(/\r?\n/)
            .map((l, i) => ("" + (i + 1)).padStart(3) + ": " + l)
            .join("\n"),
        contentType
    )
}

function callExpander(r: PromptTemplate, vars: ExpansionVariables) {
    let promptText = ""
    let errors = ""
    let success = true
    const env = new Proxy(vars, {
        get: (target: any, prop, recv) => {
            const v = target[prop]
            if (v === undefined) {
                errors += `-  \`env.${String(prop)}\` not defined\n`
                return ""
            }
            return v
        },
    })
    let logs = ""
    try {
        evalPrompt(
            {
                env,
                text: (body) => {
                    promptText +=
                        body.replace(/\n*$/, "").replace(/^\n*/, "") + "\n\n"

                    const idx = body.indexOf(vars.error)
                    if (idx >= 0) {
                        const msg = body
                            .slice(idx + vars.error.length)
                            .replace(/\n[^]*/, "")
                        throw new Error(msg)
                    }
                },
                prompt: () => {},
                systemPrompt: () => {},
            },
            r.jsSource,
            (msg) => {
                logs += msg + "\n"
            }
        )
    } catch (e) {
        success = false
        const m = /at eval.*<anonymous>:(\d+):(\d+)/.exec(e.stack)
        const info = m ? ` at prompt line ${m[1]}, column ${m[2]}` : ""
        errors += `-  ${e.name}: ${e.message}${info}\n`
    }
    return { logs, errors, success, text: promptText }
}

function expandTemplate(
    template: PromptTemplate,
    fragment: Fragment,
    vars: ExpansionVariables
) {
    const varName: Record<string, string> = {}
    for (const [k, v] of Object.entries(vars)) {
        if (!varName[v]) varName[v] = k
    }
    const varMap = vars as any as Record<string, string | any[]>

    // we put errors on top so they draw attention
    let info = `
# Prompt trace

@@errors@@

## Prompt template "${template.title}" (\`${template.id}\`)
${numberedFenceMD(template.jsSource)}

`

    let errors = ``

    const cat = categoryPrefix(template, fragment)
    const prompt = callExpander(template, vars)

    const expanded = cat.text + "\n" + prompt.text
    errors += prompt.errors

    info += cat.info

    // always append, even if empty - should help with discoverability:
    // "Oh, so I can console.log() from prompt!"
    info += `\n## console.log() output from prompt\n`
    info += fenceMD(prompt.logs)

    info += "\n## Expanded prompt\n"
    info += fenceMD(prompt.text)
    info += traceVars()

    info = info.replace("@@errors@@", errors)

    let systemText = ""
    let model = template.model
    let temperature = template.temperature
    let max_tokens = template.maxTokens

    info += `## System prompt\n`

    const systems = template.system ?? ["system"]
    for (let i = 0; i < systems.length; ++i) {
        let systemTemplate = systems[i]
        let system = fragment.file.project.getTemplate(systemTemplate)
        if (!system) {
            if (systemTemplate)
                info += `\n** error: \`${systemTemplate}\` not found\n`
            if (i > 0) continue
            systemTemplate = "system"
            system = fragment.file.project.getTemplate(systemTemplate)
            assert(!!system)
        }

        const sysex = callExpander(system, vars).text
        systemText += sysex + "\n"

        model = model ?? system.model
        temperature = temperature ?? system.temperature
        max_tokens = max_tokens ?? system.maxTokens

        info += `###  template: \`${systemTemplate}\`\n`
        if (system.model) info += `-  model: \`${system.model || ""}\`\n`
        if (system.temperature !== undefined)
            info += `-  temperature: ${system.temperature || ""}\n`
        if (system.maxTokens !== undefined)
            info += `-  max tokens: ${system.maxTokens || ""}\n`

        info += numberedFenceMD(system.jsSource)
        info += "#### Expanded system prompt"
        info += fenceMD(sysex)
    }

    model = model ?? fragment.project.coarchJson.model ?? defaultModel
    temperature = temperature ?? defaultTemperature
    max_tokens = max_tokens ?? defaultMaxTokens

    return {
        expanded,
        errors,
        info,
        success: prompt.success,
        model,
        temperature,
        max_tokens,
        systemText,
    }

    function isComplex(k: string) {
        const v = varMap[k]
        if (typeof v === "string" && varName[v] != k) return false
        return (
            typeof v !== "string" ||
            v.length > 40 ||
            v.trim().includes("\n") ||
            v.includes("`")
        )
    }

    function traceVars() {
        let info = "\n\n## Variables\n"

        info += "Variables are referenced through `env.NAME` in prompts.\n\n"

        for (const k of Object.keys(vars)) {
            if (isComplex(k)) continue
            const v = varMap[k]
            if (typeof v === "string" && varName[v] != k)
                info += `-   env.**${k}**: same as **${varName[v]}**\n\n`
            else info += `-   env.**${k}**: \`${v}\`\n\n`
        }

        for (const k of Object.keys(vars)) {
            if (!isComplex(k)) continue
            const v = varMap[k]
            info += `-   env.**${k}**${fenceMD(
                typeof v === "string" ? v : inspect(v),
                typeof v === "string" ? "" : "js"
            )}\n`
        }

        return info
    }
}

function fragmentMD(t: Fragment) {
    return t.text
}

function subtreeMD(t: Fragment): string {
    const hd = fragmentMD(t)
    const ch = t.sameFileChildren()
    if (ch.length == 0) return hd
    return [hd, ...ch.map(subtreeMD)].join("\n\n")
}

function categoryPrefix(template: PromptTemplate, frag: Fragment) {
    let text = ""
    let info = ""
    const used = new Set<string>()
    const attrs = commentAttributes(frag)
    if (template.categories?.length || attrs["@prompt"]) {
        info += "\n## Inline prompts\n"

        info += `\nAdded as comment at the end of a fragment: 

\`\`\`markdown
Lorem ipsum...

<!-- @prompt.NAME 
You are concise.
!-->
\`\`\`
        

`

        const prefs = template.categories?.length
            ? concatArrays(
                  ...template.categories.map((s) => prefixes("@prompt." + s))
              )
            : ["@prompt"]
        for (const pref of prefs) {
            if (used.has(pref)) continue
            used.add(pref)
            if (attrs[pref] === undefined) {
                info += `-   **${pref}** missing\n`
            } else {
                const v = attrs[pref]
                info += `-   **${pref}**)\n${trimNewlines(v)}\n`
                text += attrs[pref]
            }
        }
        info += "\n"
    }

    return { info, text }
}

function fragmentVars(
    template: PromptTemplate,
    frag: Fragment,
    promptOptions: { ignoreOutput?: boolean } & any
) {
    const { file } = frag
    const project = file.project
    const ignoreOutput = !!promptOptions?.ignoreOutput

    const links: LinkedFile[] = []
    if (!ignoreOutput)
        for (const ref of frag.references) {
            const file = project.allFiles.find(
                (f) => f.filename === ref.filename
            )
            if (file)
                links.push({
                    label: ref.name,
                    filename: relativePath(host.projectFolder(), file.filename),
                    content: file.content,
                })
        }
    const vars: Partial<ExpansionVariables> = {
        ...staticVars(),
        heading: "#".repeat(frag.depth),
        subheading: "#".repeat(frag.depth + 1),
        fragment: fragmentMD(frag),
        children: frag.sameFileChildren().map(fragmentMD).join("\n\n"),
        subtree: subtreeMD(frag),
        file: {
            filename: file.filename,
            label: "current",
            content: file.content,
        },
        links,
        promptOptions,
        template,
    }

    let refChildren = ""
    for (const e of frag.references) {
        const rt = project.resolve(e.filename)
        if (!rt) continue
        const ext = e.filename.replace(/.*\./, "")
        if (ext === "md") {
            const root = rt.roots?.[0]
            if (root) {
                if (refChildren) refChildren += "\n\n"
                refChildren += rt.roots.map(fragmentMD).join("\n\n")
            }
        } else {
            if (template.output && !ignoreOutput) {
                if (e.filename.endsWith(template.output))
                    vars.output = rt.content
            }
        }
    }
    if (refChildren) vars.refChildren = refChildren
    let outputFragment: Fragment = undefined
    if (template.prePost) {
        const { pre, post } = frag.prePostText()
        vars.subtreePre = pre
        vars.subtreePost = post
        if (template.output && !ignoreOutput)
            for (const ch of frag.children) {
                if (ch.file.filename.endsWith(template.output)) {
                    const { pre, self, post } = ch.prePostText()
                    vars.outputPre = pre
                    vars.output = self
                    vars.outputPost = post
                    outputFragment = ch
                    break
                }
            }
    }
    return { vars, outputFragment }
}

export type RunTemplateOptions = ChatCompletionsOptions & {
    infoCb?: (partialResponse: FragmentTransformResponse) => void
    promptOptions?: any
}

export async function runTemplate(
    template: PromptTemplate,
    fragment: Fragment,
    options?: RunTemplateOptions
): Promise<FragmentTransformResponse> {
    const { vars, outputFragment } = fragmentVars(
        template,
        fragment,
        options.promptOptions
    )
    let {
        expanded,
        success,
        info,
        model,
        temperature,
        max_tokens,
        systemText,
    } = expandTemplate(template, fragment, vars as ExpansionVariables)
    options?.infoCb?.({ edits: [], info, text: "Computing..." })

    info += "\n\n## Final prompt\n\n"

    if (model) info += `-  model: \`${model || ""}\`\n`
    if (temperature !== undefined)
        info += `-  temperature: ${temperature || ""}\n`
    if (max_tokens !== undefined) info += `-  max tokens: ${max_tokens || ""}\n`

    info += fenceMD(expanded)

    // if the expansion failed, show the user the trace
    if (!success) {
        return {
            info,
            dialogText: "# Template failed\nSee info below.\n" + info,
            edits: [],
            text: "None",
        }
    }

    let text: string
    try {
        text = await getChatCompletions(
            {
                model,
                temperature,
                max_tokens,
                messages: [
                    {
                        role: "system",
                        content: systemText,
                    },
                    {
                        role: "user",
                        content: expanded,
                    },
                ],
            },
            options
        )
    } catch (error: unknown) {
        if (error instanceof RequestError) {
            info += `## Request error\n\n`
            info += error.statusText + "\n\n"
            info += `-   status: ${error.status}`
            options.infoCb({ edits: [], info, text: "Request error" })
        }
        throw error
    }

    const edits: Edits[] = []
    const obj = {
        label: template.title,
        filename: fragment.file.filename,
    }

    info +=
        "\n\n## AI Output\n\n" +
        fenceMD(
            text,
            template.outputContentType ?? template.output?.replace(/^\./, "")
        )

    const extr = extractFenced(text)

    const res: FragmentTransformResponse = {
        edits,
        info,
        text: extr.remaining,
    }

    for (const [name, val] of Object.entries(extr.vars)) {
        if (name.startsWith("File ")) {
            delete extr.vars[name]
            const n = name.slice(5).trim()
            const fn = host.resolvePath(fragment.file.filename, "..", n)
            const curr = fragment.references.find(
                (r) => host.resolvePath(r.filename) === fn
            )?.filename

            if (await fileExists(fn)) {
                const content = await readText(fn)
                edits.push({
                    label: `Update ${fn}`,
                    filename: fn,
                    type: "replace",
                    range: [[0, 0], stringToPos(content)],
                    text: val,
                })
            } else {
                edits.push({
                    label: `Create ${fn}`,
                    filename: fn,
                    type: "createfile",
                    text: val,
                    overwrite: true,
                })
            }

            if (!curr) {
                const link = `-   [${n}](./${n})`
                // TODO: include links as part of AST
                edits.push({
                    ...obj,
                    type: "insert",
                    pos: fragment.endPos,
                    text: `\n\n${link}\n`,
                })
            }
        }
    }

    const keys = Object.keys(extr.vars)
    // if there is only one "Foo: ..." thing left, assume it's the output
    if (keys.length == 1) {
        text = extr.vars[keys[0]]
    }

    text = text.trim()

    const m = /^(```+)(\w*)\n/.exec(text)
    if (m && text.endsWith(m[1]))
        text = text.slice(m[0].length, -m[1].length).trim()

    if (template.replaces === "file") {
        const numlines = fragment.file.content.replace(/[^\n]/g, "").length
        edits.push({
            ...obj,
            filename: fragment.file.filename,
            type: "replace",
            range: [
                [0, 0],
                [numlines + 1, 0],
            ],
            text: text.trim(),
        })
    } else if (template.replaces == "children") {
        if (fragment.sameFileChildren().length)
            edits.push({
                ...obj,
                type: "replace",
                range: rangeOfFragments(...fragment.sameFileChildren()),
                text,
            })
        else
            edits.push({
                ...obj,
                type: "insert",
                pos: fragment.endPos,
                text: "\n\n" + text,
            })
    } else if (template.replaces == "fragment") {
        edits.push({
            ...obj,
            type: "replace",
            range: rangeOfFragments(fragment),
            text,
        })
    } else if (outputFragment) {
        edits.push({
            ...obj,
            filename: outputFragment.file.filename,
            type: "replace",
            range: [outputFragment.startPos, outputFragment.endPos],
            text: text.trim(),
        })
    } else if (template.output) {
        const ext = template.output
        const curr = fragment.references.find((r) =>
            r.filename.endsWith(ext)
        )?.filename
        let filename = curr

        if (!filename) {
            const rootPath = fragment.file.filename.replace(
                /(\.coarch)?\.mdx?$/,
                ""
            )
            filename = rootPath + ext
            let i = 1
            while (await fileExists(filename)) {
                filename = rootPath + i + ext
                i++
            }
        }

        if (await fileExists(filename)) {
            const prev = await readText(filename)
            const numlines = prev.replace(/[^\n]/g, "").length
            edits.push({
                ...obj,
                filename,
                type: "replace",
                range: [
                    [0, 0],
                    [numlines + 1, 0],
                ],
                text: text.trim(),
            })
        } else {
            edits.push({
                ...obj,
                filename,
                type: "createfile",
                overwrite: curr ? true : false,
                ignoreIfExists: false,
                text: text.trim(),
            })
        }

        if (!curr) {
            const link = `-   [${
                template.outputLinkName ?? template.id
            }](./${filename.replace(/.*[\\\/]/, "")})`
            // TODO: include links as part of AST
            edits.push({
                ...obj,
                type: "insert",
                pos: fragment.endPos,
                text: `\n\n${link}\n`,
            })
        }
    } else {
        if (Object.keys(extr.vars).length == 0) res.dialogText = extr.remaining
        else res.dialogText = text
    }

    return res
}
