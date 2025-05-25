/// <reference path="../../core/src/types/prompt_template.d.ts" />
/// <reference path="./vscode-elements.d.ts" />
import React, { useEffect, useMemo, useRef, useState } from "react"

import "@vscode-elements/elements/dist/vscode-button"
import "@vscode-elements/elements/dist/vscode-single-select"
import "@vscode-elements/elements/dist/vscode-option"
import "@vscode-elements/elements/dist/vscode-textfield"
import "@vscode-elements/elements/dist/vscode-checkbox"
import "@vscode-elements/elements/dist/vscode-form-container"
import "@vscode-elements/elements/dist/vscode-form-group"
import "@vscode-elements/elements/dist/vscode-form-helper"
import "@vscode-elements/elements/dist/vscode-label"
import "@vscode-elements/elements/dist/vscode-progress-ring"
import "@vscode-elements/elements/dist/vscode-collapsible"
import "@vscode-elements/elements/dist/vscode-tabs"
import "@vscode-elements/elements/dist/vscode-tab-header"
import "@vscode-elements/elements/dist/vscode-tab-panel"
import "@vscode-elements/elements/dist/vscode-badge"
import "@vscode-elements/elements/dist/vscode-textarea"
import "@vscode-elements/elements/dist/vscode-multi-select"
import "@vscode-elements/elements/dist/vscode-scrollable"
import "@vscode-elements/elements/dist/vscode-tree"
import "@vscode-elements/elements/dist/vscode-split-layout"

import Markdown from "./Markdown"
import { useDropzone } from "react-dropzone"
import { lookupMime } from "../../core/src/mime"
import { VscodeMultiSelect } from "@vscode-elements/elements/dist/vscode-multi-select/vscode-multi-select"
import MarkdownPreviewTabs from "./MarkdownPreviewTabs"
import {
    TreeItem,
    VscodeTree,
} from "@vscode-elements/elements/dist/vscode-tree/vscode-tree"
import CONFIGURATION from "../../core/src/llms.json"
import { MODEL_PROVIDER_GITHUB_COPILOT_CHAT } from "../../core/src/constants"
import { apiKey, hosted, viewMode } from "./configuration"
import { JSONBooleanOptionsGroup, JSONSchemaObjectForm } from "./JSONSchema"
import { ActionButton } from "./ActionButton"
import Suspense from "./Suspense"
import type { ChatCompletion } from "../../core/src/chattypes"
import { RunClientProvider, useClientReadyState } from "./RunClientContext"
import {
    useApi,
    useScripts,
    useEnv,
    useScript,
    useModels,
    ApiProvider,
} from "./ApiContext"
import { ScriptProvider, useScriptId } from "./ScriptContext"
import { ResultsTabs } from "./Results"
import { RunnerProvider, useRunner } from "./RunnerContext"
import { ImportedFile } from "./types"
import { ProjectView } from "./ProjectView"
import { prettyBytes } from "../../core/src/pretty"
import { RunResultSelector } from "./Runs"

function useSyncProjectScript() {
    const { scriptid, setScriptid } = useScriptId()
    const { runId } = useRunner()
    const scripts = useScripts()
    useEffect(() => {
        if (!scriptid && scripts.length > 0) {
            if (!runId) setScriptid(scripts[0].id)
        } else if (scriptid && !scripts.find((s) => s.id === scriptid)) {
            setScriptid(runId ? undefined : scripts[0]?.id)
        }
    }, [scripts, scriptid, runId])
}

function GenAIScriptLogo(props: { height: string }) {
    const { height } = props
    return (
        <img
            alt="GenAIScript logo"
            src="/favicon.svg"
            style={{ height, borderRadius: "2px" }}
        />
    )
}

function acceptToAccept(accept: string | undefined) {
    if (!accept) return undefined
    const res: Record<string, string[]> = {}
    const extensions = accept
        .split(",")
        .map((ext) => ext.trim().replace(/^\*\./, "."))
    for (const ext of extensions) {
        const mime = lookupMime(ext)
        if (mime) {
            const exts = res[mime] || (res[mime] = [])
            if (!exts.includes(ext)) exts.push(ext)
        }
    }
    return res
}

function FilesFormInput() {
    const script = useScript()
    const { accept } = script || {}
    if (!script)
        return (
            <vscode-form-group>
                <vscode-label>Select a script to run.</vscode-label>
            </vscode-form-group>
        )
    if (accept === "none")
        return (
            <vscode-form-group>
                <vscode-label>No files accepted.</vscode-label>
            </vscode-form-group>
        )
    return <FilesDropZone script={script} />
}

function FilesDropZone(props: { script: PromptScript }) {
    const { script } = props
    const { accept } = script || {}
    const { acceptedFiles, isDragActive, getRootProps, getInputProps } =
        useDropzone({ multiple: true, accept: acceptToAccept(accept) })
    const { importedFiles, setImportedFiles } = useApi()

    useEffect(() => {
        const newImportedFiles = [...importedFiles]
        if (acceptedFiles?.length) {
            for (const f of acceptedFiles)
                if (!newImportedFiles.find((nf) => nf.path === f.path)) {
                    ;(f as ImportedFile).selected = true
                    newImportedFiles.push(f)
                }
        }
        if (newImportedFiles.length !== importedFiles.length)
            setImportedFiles(newImportedFiles)
    }, [importedFiles, acceptedFiles])

    return (
        <>
            <vscode-form-group>
                <vscode-label>Files</vscode-label>
                <vscode-multi-select
                    onChange={(e) => {
                        e.preventDefault()
                        const target = e.target as VscodeMultiSelect
                        const newImportedFiles = [...importedFiles]
                        const selected = target.selectedIndexes
                        for (let i = 0; i < newImportedFiles.length; i++) {
                            newImportedFiles[i].selected = selected.includes(i)
                        }
                        setImportedFiles(newImportedFiles)
                    }}
                >
                    {importedFiles.map((file) => (
                        <vscode-option
                            key={file.path}
                            value={file.path}
                            selected={file.selected}
                        >
                            {file.name} ({prettyBytes(file.size)})
                        </vscode-option>
                    ))}
                </vscode-multi-select>
            </vscode-form-group>
            <vscode-form-group
                className="dropzone"
                style={{
                    ...(isDragActive ? { outline: "2px dashed #333" } : {}),
                }}
                {...getRootProps({ className: "dropzone" })}
            >
                <input {...getInputProps()} />
                <vscode-form-helper>
                    {isDragActive
                        ? `Drop the files here ...`
                        : `Drag 'n' drop some files here, or click to select files ${accept ? `(${accept})` : ""}`}
                </vscode-form-helper>
            </vscode-form-group>
        </>
    )
}

function ScriptDescription() {
    const script = useScript()
    if (!script) return null
    const { title, description } = script
    return (
        <vscode-form-helper>
            {title ? <b>{title}</b> : null}
            {description ? (
                <Markdown readme={true} className="no-margins">
                    {description}
                </Markdown>
            ) : null}
        </vscode-form-helper>
    )
}

function RefreshButton() {
    const { refresh } = useApi()
    return (
        <ActionButton
            name="refresh"
            label="reload script list"
            onClick={refresh}
        />
    )
}

function ScriptSelect() {
    const scripts = useScripts()
    const { scriptid, setScriptid } = useScriptId()
    const { refresh } = useApi()
    const { filename } = useScript() || {}

    return (
        <vscode-form-group>
            <vscode-label style={{ padding: 0 }}>
                <GenAIScriptLogo height="2em" />
            </vscode-label>
            <vscode-single-select
                id="script-selector"
                value={scriptid}
                combobox
                filter="fuzzy"
                onvsc-change={(e: Event) => {
                    const target = e.target as HTMLSelectElement
                    setScriptid(target.value)
                }}
                title={filename}
            >
                {scripts
                    .filter((s) => !s.isSystem && !s.unlisted)
                    .map(({ id, title }) => (
                        <vscode-option
                            value={id}
                            selected={scriptid === id}
                            description={title}
                        >
                            {id}
                        </vscode-option>
                    ))}
            </vscode-single-select>
            <ScriptDescription />
        </vscode-form-group>
    )
}

function ScriptForm() {
    return (
        <vscode-collapsible open title="Script">
            <RefreshButton />
            <ScriptSelect />
            <FilesFormInput />
            <PromptParametersFields />
            <RunScriptButton />
        </vscode-collapsible>
    )
}

function RunButtonOptions() {
    const script = useScript()

    const { parameters, setParameters } = useApi()
    const { inputSchema } = script || {}
    if (!Object.keys(inputSchema?.properties || {}).length) return null

    const scriptParameters = inputSchema.properties[
        "script"
    ] as JSONSchemaObject
    const runOptions: [string, JSONSchemaBoolean][] =
        scriptParameters?.properties
            ? Object.entries(
                  scriptParameters.properties as Record<
                      string,
                      JSONSchemaSimpleType
                  >
              )
                  .filter(
                      ([, f]) =>
                          f.type === "boolean" && f.uiType === "runOption"
                  )
                  .map(([k, f]) => [k, f as JSONSchemaBoolean])
            : undefined
    if (!runOptions) return null
    return (
        <vscode-form-group>
            <vscode-label></vscode-label>
            <JSONBooleanOptionsGroup
                properties={Object.fromEntries(runOptions)}
                value={parameters}
                fieldPrefix={""}
                onChange={setParameters}
            />
        </vscode-form-group>
    )
}

function PromptParametersFields() {
    const script = useScript()

    const { parameters, setParameters } = useApi()
    const { inputSchema } = script || {}
    if (!Object.keys(inputSchema?.properties || {}).length) return null

    const scriptParameters = inputSchema.properties[
        "script"
    ] as JSONSchemaObject
    const systemParameters = Object.entries(inputSchema.properties).filter(
        ([k]) => k !== "script"
    )
    return (
        <>
            {scriptParameters && (
                <JSONSchemaObjectForm
                    schema={scriptParameters}
                    value={parameters}
                    fieldPrefix={""}
                    onChange={setParameters}
                />
            )}
            {!!systemParameters.length && (
                <vscode-collapsible
                    className="collapsible"
                    title="System Parameters"
                >
                    {Object.entries(inputSchema.properties)
                        .filter(([k]) => k !== "script")
                        .map(([key, fieldSchema]) => {
                            return (
                                <JSONSchemaObjectForm
                                    schema={fieldSchema as JSONSchemaObject}
                                    value={parameters}
                                    fieldPrefix={`${key}.`}
                                    onChange={setParameters}
                                />
                            )
                        })}
                </vscode-collapsible>
            )}
        </>
    )
}

function ModelConfigurationTabPanel() {
    const { options, setOptions } = useApi()
    const env = useEnv()
    const { providers } = env || {}
    const models =
        providers?.flatMap(
            (p) => p.models?.map((m) => `${p.provider}:${m.id}`) || []
        ) || []

    const schema: JSONSchemaObject = {
        type: "object",
        properties: {
            cache: {
                type: "boolean",
                description: `Enable cache for LLM requests`,
                default: false,
            },
            model: {
                type: "string",
                description:
                    "'large' model identifier; this is the default model when no model is configured in the script.",
                default: "large",
                uiSuggestions: models,
            },
            smallModel: {
                type: "string",
                description: "'small' model identifier",
                default: "small",
                uiSuggestions: models,
            },
            visionModel: {
                type: "string",
                description: "'vision' model identifier",
                default: "vision",
                uiSuggestions: models,
            },
            temperature: {
                type: "number",
                description: "LLM temperature from 0 to 2",
                minimum: 0,
                maximum: 2,
                default: 0.8,
            },
            logprobs: {
                type: "boolean",
                description:
                    "Enable reporting log probabilities for each token",
                default: false,
            },
            topLogprobs: {
                type: "integer",
                description:
                    "Enables reporting log probabilities for alternate tokens",
                minimum: 0,
                maximum: 5,
                default: 0,
            },
        },
    }
    return (
        <>
            <vscode-tab-header slot="header">Model</vscode-tab-header>
            <vscode-tab-panel>
                <JSONSchemaObjectForm
                    schema={schema}
                    value={options}
                    fieldPrefix=""
                    onChange={setOptions}
                />
            </vscode-tab-panel>
        </>
    )
}

function ConfigurationTabPanel() {
    return (
        <vscode-collapsible className="collapsible" title="Configuration">
            <vscode-tabs panel>
                <ModelConfigurationTabPanel />
                <ProviderConfigurationTabPanel />
                <ChatCompletationTabPanel />
            </vscode-tabs>
        </vscode-collapsible>
    )
}

function ChatCompletationTabPanel() {
    const models = useModels()
    const [model, setModel] = useState<string>("")
    const [userContent, setUserContent] = useState<string>(
        "write a poem using emojis"
    )
    const [response, setResponse] = useState<
        ChatCompletion | { error?: string }
    >(undefined)
    const [controller, setController] = useState<AbortController | undefined>(
        undefined
    )
    const state = controller ? "running" : undefined
    const title = state === "running" ? "Abort" : "Run"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        setResponse(undefined)
        try {
            const body = {
                model: model,
                messages: [{ role: "user", content: userContent }],
            }
            const resp = await fetch("/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: apiKey,
                },
                signal: c.signal,
                body: JSON.stringify(body),
            })
            if (c.signal.aborted) {
                console.log(`openai request aborted`)
                return
            }
            if (!resp.ok)
                setResponse({
                    error: `Error: ${resp.status} ${resp.statusText}`,
                })
            else setResponse(await resp.json())
        } catch (e) {
            c.abort()
            setResponse({ error: `Error: ${e}` })
        } finally {
            setController(undefined)
        }
    }

    return (
        <>
            <vscode-tab-header slot="header">OpenAI API</vscode-tab-header>
            <vscode-tab-panel>
                <form onSubmit={handleSubmit}>
                    <vscode-form-group>
                        <vscode-label>model:</vscode-label>
                        <vscode-single-select
                            value={model}
                            combobox
                            filter="fuzzy"
                            creatable
                            onvsc-change={(e: Event) => {
                                const target = e.target as HTMLSelectElement
                                setModel(target.value)
                            }}
                        >
                            <vscode-option value=""></vscode-option>
                            {models?.data?.map((m) => (
                                <vscode-option key={m.id} value={m.id}>
                                    {m.id}
                                </vscode-option>
                            ))}
                        </vscode-single-select>
                    </vscode-form-group>
                    <vscode-form-container>
                        <vscode-form-group>
                            <vscode-label>user:</vscode-label>
                            <vscode-textarea
                                rows={5}
                                value={userContent}
                                onvsc-change={(e: Event) => {
                                    const target =
                                        e.target as HTMLTextAreaElement
                                    setUserContent(target.value)
                                }}
                                placeholder="user message"
                            ></vscode-textarea>
                        </vscode-form-group>
                        <vscode-form-group>
                            <vscode-label></vscode-label>
                            <vscode-button
                                icon={
                                    state === "running" ? "stop-circle" : "play"
                                }
                                type="submit"
                                title={title}
                            >
                                {title}
                            </vscode-button>
                            <ModelOptionsFormHelper />
                        </vscode-form-group>
                        {response ? (
                            <vscode-form-group>
                                <vscode-label></vscode-label>
                                <vscode-tabs>
                                    <MarkdownPreviewTabs
                                        text={JSON.stringify(response, null, 2)}
                                        renderText={
                                            (response as ChatCompletion)
                                                ?.choices?.length
                                                ? (
                                                      response as ChatCompletion
                                                  )?.choices
                                                      .map(
                                                          ({ message }) =>
                                                              message.content
                                                      )
                                                      .join("\n<br/>\n")
                                                : `
\`\`\`json
${JSON.stringify(response, null, 2) || ""}
\`\`\`
`
                                        }
                                    />
                                </vscode-tabs>
                            </vscode-form-group>
                        ) : null}
                    </vscode-form-container>
                </form>
            </vscode-tab-panel>
        </>
    )
}

function ProviderConfigurationTabPanel() {
    const env = useEnv()
    const { providers } = env || {}
    if (!providers?.length) return null

    const ref = useRef<VscodeTree | null>(null)
    useEffect(() => {
        if (!ref.current) return
        if (!providers) ref.current.data = []
        else {
            const icons = {
                leaf: "robot",
                branch: "chevron-right",
                open: "chevron-down",
            }
            const missingIcons = {
                branch: "circle-large",
                leaf: "circle-large",
                open: "chevron-down",
            }
            const errorIcons = {
                branch: "error",
                leaf: "error",
                open: "chevron-down",
            }
            const PROVIDERS = CONFIGURATION.providers
            const data: TreeItem[] = PROVIDERS.filter(
                ({ id }) => id !== MODEL_PROVIDER_GITHUB_COPILOT_CHAT
            )
                .map((def) => ({
                    ...(providers.find((p) => p.provider === def.id) || {}),
                    detail: def.detail,
                    provider: def.id,
                    url: def.url,
                    missing: !providers.find((p) => p.provider === def.id),
                }))
                .map(
                    (r) =>
                        ({
                            icons: r.error
                                ? errorIcons
                                : r.missing
                                  ? missingIcons
                                  : icons,
                            label: r.provider,
                            description: r.error ?? r.base,
                            tooltip: r.detail,
                            subItems: r.models?.map(
                                ({ id, url }) =>
                                    ({
                                        label: id,
                                        description: url,
                                    }) satisfies TreeItem
                            ),
                        }) satisfies TreeItem
                )
            ref.current.data = data
        }
    }, [providers])

    return (
        <>
            <vscode-tab-header slot="header">LLM Providers</vscode-tab-header>
            <vscode-tab-panel>
                <vscode-tree indent-guides indent={8} ref={ref} />
                <vscode-label>
                    <a href="https://microsoft.github.io/genaiscript/getting-started/configuration/">
                        Configuration documentation
                    </a>
                </vscode-label>
            </vscode-tab-panel>
        </>
    )
}

function ClientReadyStateLabel() {
    const readyState = useClientReadyState()
    if (readyState === "open") return null
    return (
        <vscode-label title={`server connection status: ${readyState}`}>
            {readyState}
        </vscode-label>
    )
}

function ModelOptionsFormHelper() {
    const { options } = useApi()
    return (
        <>
            <vscode-form-helper>
                {Object.entries(options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
            </vscode-form-helper>
        </>
    )
}

function RunScriptButton() {
    const { scriptid } = useScriptId()
    const { state } = useRunner()

    if (!scriptid) return null

    const title = state === "running" ? "Abort" : "Run"
    return (
        <>
            <vscode-form-group>
                <ClientReadyStateLabel />
                <vscode-button
                    icon={state === "running" ? "stop-circle" : "play"}
                    type="submit"
                    title={title}
                >
                    {title}
                </vscode-button>
                <ModelOptionsFormHelper />
            </vscode-form-group>
            <RunButtonOptions />
        </>
    )
}

function ScriptView() {
    return (
        <Suspense>
            <RunForm />
            <ConfigurationTabPanel />
        </Suspense>
    )
}

function RunForm() {
    const { run, cancel, state } = useRunner()
    const { files, importedFiles, parameters, options } = useApi()
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (state === "running") cancel()
        else run(files, importedFiles, parameters, options)
    }
    useSyncProjectScript()

    return (
        <form onSubmit={handleSubmit}>
            <ScriptForm />
        </form>
    )
}

function ResultsView() {
    const [showRuns, setShowRuns] = useState(false)
    const handleShowRuns = () => setShowRuns((prev) => !prev)
    return (
        <vscode-collapsible className="collapsible" open title="Result">
            <ActionButton
                name="history"
                label={showRuns ? "Show previous runs" : "Hide previous runs"}
                onClick={handleShowRuns}
            />
            {showRuns && <RunResultSelector />}
            <Suspense>
                <ResultsTabs />
            </Suspense>
        </vscode-collapsible>
    )
}

function WebApp() {
    switch (viewMode) {
        case "results":
            return (
                <Suspense>
                    <ResultsTabs />
                </Suspense>
            )
        default:
            return (
                <div style={{ minHeight: "100vh" }}>
                    <ApiProvider>
                        {!hosted ? <ProjectView /> : null}
                        <ScriptView />
                    </ApiProvider>
                    <ResultsView />
                </div>
            )
    }
}

export default function App() {
    return (
        <ScriptProvider>
            <RunClientProvider>
                <RunnerProvider>
                    <Suspense>
                        <WebApp />
                    </Suspense>
                </RunnerProvider>
            </RunClientProvider>
        </ScriptProvider>
    )
}
