import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { registerCommand } from "./commands"
import {
    TYPE_DEFINITION_BASENAME,
    TYPE_DEFINITION_REFERENCE,
} from "../../core/src/constants"
import { NotSupportedError } from "../../core/src/error"
import { promptParameterTypeToJSONSchema } from "../../core/src/parameters"
import { promptDefinitions } from "../../core/src/default_prompts"
import { createFetch } from "../../core/src/fetch"

type TemplateQuickPickItem = {
    template?: PromptScript
    action?: "create"
} & vscode.QuickPickItem

async function showPromptParametersQuickPicks(
    script: PromptScript
): Promise<PromptParameters> {
    const parameters: PromptParameters = {}
    if (!script?.parameters) return {}

    for (const param in script.parameters || {}) {
        const schema = promptParameterTypeToJSONSchema(script.parameters[param])
        switch (schema.type) {
            case "string": {
                let value: string
                const enums = schema.enum
                const uiSuggestions = schema.uiSuggestions
                if (enums?.length) {
                    const res = await vscode.window.showQuickPick(
                        enums.map((e) => ({
                            label: e,
                            description: e,
                        })),
                        {
                            title: `Choose ${schema.title || param} ${schema.description || ""}`,
                            placeHolder: schema.default,
                            canPickMany: false,
                        }
                    )
                    value = res?.label
                } else if (uiSuggestions) {
                    const custom = "Enter a custom value"
                    const res = await vscode.window.showQuickPick(
                        [
                            ...uiSuggestions.map((e) => ({
                                label: e,
                                description: e,
                            })),
                            {
                                label: custom,
                                description:
                                    "Enter a custom value not in the suggestions.",
                            },
                        ],
                        {
                            title: `Choose ${schema.title || param} ${schema.description || ""}`,
                            placeHolder: schema.default,
                            canPickMany: false,
                        }
                    )
                    value = res?.label
                    if (value === custom) {
                        value = await vscode.window.showInputBox({
                            title: `Enter value for ${schema.title || param}`,
                            value: schema.default,
                            prompt: schema.description,
                        })
                    }
                    if (value === undefined) return undefined
                } else {
                    value = await vscode.window.showInputBox({
                        title: `Enter value for ${schema.title || param}`,
                        value: schema.default,
                        prompt: schema.description,
                    })
                }
                if (value === undefined) return undefined
                parameters[param] = value
                break
            }
            case "boolean": {
                const value = await vscode.window.showQuickPick(
                    [{ label: "yes" }, { label: "no" }],
                    {
                        title: `Choose ${schema.title || param} ${schema.description || ""}`,
                        canPickMany: false,
                    }
                )
                if (value === undefined) return undefined
                parameters[param] = value.label === "yes"
                break
            }
            case "integer":
            case "number": {
                const parse = schema.type === "integer" ? parseInt : parseFloat
                const value = await vscode.window.showInputBox({
                    title: `Enter ${schema.type} value for ${schema.title || param}`,
                    value: schema.default?.toString(),
                    prompt: schema.description,
                    validateInput: (v) => {
                        v = v.trim()
                        const x = parse(v)
                        const msg =
                            isNaN(x) || String(x) !== v
                                ? `Enter a valid, finite ${schema.type}`
                                : null
                        return msg
                    },
                })
                if (value === undefined) return undefined
                parameters[param] = parse(value)
                break
            }
            default:
                throw new NotSupportedError(
                    "Unsupported parameter type " + schema.type
                )
        }
    }
    return parameters
}

export function activateFixCommand(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const fragmentFix = async (file: vscode.Uri) => {
        if (file.scheme === "gist") {
            // Extract the gist ID from the URI
            const gistId = file.authority
            if (!gistId) {
                vscode.window.showErrorMessage(
                    "Unable to determine gist ID from URI"
                )
                return
            }

            const session = await vscode.authentication.getSession(
                "github",
                ["gist"],
                { createIfNone: true }
            )
            if (!session) {
                vscode.window.showErrorMessage(
                    "Failed to authenticate with GitHub"
                )
                return
            }

            // Show progress notification
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Updating gist...",
                    cancellable: false,
                },
                async () => {
                    // Use the GitHub REST API to update the gist
                    const fetch = await createFetch()
                    const res = await fetch(
                        "https://api.github.com/gists/" + gistId,
                        {
                            method: "PATCH",
                            headers: {
                                Accept: "application/vnd.github+json",
                                Authorization: `Bearer ${session.accessToken}`,
                                "X-GitHub-Api-Version": "2022-11-28",
                            },
                            body: JSON.stringify({
                                files: {
                                    [TYPE_DEFINITION_BASENAME]: {
                                        content:
                                            promptDefinitions[
                                                TYPE_DEFINITION_BASENAME
                                            ],
                                    },
                                    "tsconfig.json": {
                                        content:
                                            promptDefinitions["tsconfig.json"],
                                    },
                                },
                            }),
                        }
                    )
                    if (!res.ok) {
                        vscode.window.showErrorMessage(
                            `Failed to update gist: ${res.statusText}`
                        )
                        return
                    } else {
                        await vscode.commands.executeCommand(
                            "gistpad.refreshGists"
                        )
                    }
                }
            )

            const editor = vscode.window.visibleTextEditors.find(
                (e) => e.document?.uri?.toString() === file.toString()
            )
            if (editor) {
                const text = editor.document.getText()
                if (!text.startsWith(TYPE_DEFINITION_REFERENCE)) {
                    // Insert the TYPE_DEFINITION_REFERENCE at the top of the document
                    const position = new vscode.Position(0, 0)
                    const edit = new vscode.WorkspaceEdit()
                    edit.insert(
                        editor.document.uri,
                        position,
                        TYPE_DEFINITION_REFERENCE
                    )
                    await vscode.workspace.applyEdit(edit)
                    await editor.document.save()
                }
            }
        }
    }

    subscriptions.push(registerCommand("genaiscript.fragment.fix", fragmentFix))
}
