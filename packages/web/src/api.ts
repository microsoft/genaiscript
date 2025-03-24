import { ChatModels } from "../../core/src/chattypes"
import {
    Project,
    PromptScriptEndResponseEvent,
    PromptScriptListResponse,
    RunResultListResponse,
    ServerEnvResponse,
} from "../../core/src/server/messages"
import { apiKey, base } from "./configuration"

export const fetchScripts = async (): Promise<Project> => {
    const res = await fetch(`${base}/api/scripts`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: PromptScriptListResponse = await res.json()
    return j.project
}
export const fetchEnv = async (): Promise<ServerEnvResponse> => {
    const res = await fetch(`${base}/api/env`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: ServerEnvResponse = await res.json()
    return j
}
export const fetchRuns = async (): Promise<RunResultListResponse> => {
    const res = await fetch(`${base}/api/runs`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: RunResultListResponse = await res.json()
    return j
}
export const fetchModels = async (): Promise<ChatModels> => {
    const res = await fetch(`${base}/v1/models`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: ChatModels = await res.json()
    return j
}
export const fetchRun = async (
    runId: string
): Promise<PromptScriptEndResponseEvent> => {
    if (!runId) return undefined
    const res = await fetch(`${base}/api/runs/${runId}`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: PromptScriptEndResponseEvent = await res.json()
    return j
}
