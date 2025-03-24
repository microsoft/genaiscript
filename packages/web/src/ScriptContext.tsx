import React, { createContext, useState, useMemo, useEffect, use } from "react"
import { ChatModels } from "../../core/src/chattypes"
import {
    Project,
    ServerEnvResponse,
    RunResultListResponse,
} from "../../core/src/server/messages"
import { fetchEnv, fetchScripts, fetchRuns, fetchModels } from "./api"
import { useLocationHashValue } from "./useLocationHashValue"
import { useUrlSearchParams } from "./useUrlSearchParam"
import { FileWithPath } from "react-dropzone/."

export type ImportedFile = FileWithPath & { selected?: boolean }

export const ScriptContext = createContext<{
    scriptid: string | undefined
    setScriptid: (id: string) => void
} | null>(null)

export function ScriptProvider({ children }: { children: React.ReactNode }) {
    const [scriptid, setScriptid] = useLocationHashValue("scriptid")

    return (
        <ScriptContext.Provider
            value={{
                scriptid,
                setScriptid,
            }}
        >
            {children}
        </ScriptContext.Provider>
    )
}

export function useScriptId() {
    const api = use(ScriptContext)
    if (!api) throw new Error("missing script id context")
    return api
}
