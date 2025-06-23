// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { createContext, useState, useMemo, use } from "react";
import { ChatModels } from "../../core/src/chattypes";
import { Project, ServerEnvResponse } from "../../core/src/server/messages";
import { fetchEnv, fetchScripts, fetchModels } from "./api";
import { useUrlSearchParams } from "./useUrlSearchParam";
import { useScriptId } from "./ScriptContext";
import { ImportedFile } from "./types";

export const ApiContext = createContext<{
  project: Promise<Project | undefined>;
  env: Promise<ServerEnvResponse | undefined>;

  files: string[];
  setFiles: (files: string[]) => void;
  importedFiles: ImportedFile[];
  setImportedFiles: (files: ImportedFile[]) => void;
  parameters: PromptParameters;
  setParameters: (parameters: PromptParameters) => void;
  options: ModelOptions;
  setOptions: (f: (prev: ModelConnectionOptions) => ModelConnectionOptions) => void;
  refresh: () => void;
  models: Promise<ChatModels | undefined>;
} | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [refreshId, setRefreshId] = useState(0);
  const env = useMemo<Promise<ServerEnvResponse>>(fetchEnv, [refreshId]);
  const project = useMemo<Promise<Project>>(fetchScripts, [refreshId]);
  const models = useMemo<Promise<ChatModels>>(fetchModels, [refreshId]);

  const refresh = () => setRefreshId((prev) => prev + 1);

  const [state, setState] = useUrlSearchParams<
    {
      files: string[];
    } & ModelConnectionOptions
  >(
    {
      files: [],
    },
    {
      scriptid: { type: "string" },
      files: { type: "array", items: { type: "string" } },
      cache: { type: "boolean" },
      provider: { type: "string" },
      model: { type: "string" },
      smallModel: { type: "string" },
      visionModel: { type: "string" },
      temperature: { type: "number" },
      logprobs: { type: "boolean" },
      topLogprobs: { type: "integer" },
    },
  );
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const { files, ...options } = state;
  const [parameters, setParameters] = useState<PromptParameters>({});
  const setFiles = (files: string[]) =>
    setState((prev) => ({
      ...prev,
      files: files.filter((s) => s !== "").slice(),
    }));
  const setOptions = (f: (prev: ModelConnectionOptions) => ModelConnectionOptions) => {
    setState((prev) => ({ ...prev, ...f(options) }));
  };

  return (
    <ApiContext.Provider
      value={{
        project,
        env,
        files,
        setFiles,
        importedFiles,
        setImportedFiles,
        parameters,
        setParameters,
        options,
        setOptions,
        refresh,
        models,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const api = use(ApiContext);
  if (!api) throw new Error("missing api context");
  return api;
}

export function useEnv() {
  const { env: envPromise } = useApi();
  const env = use(envPromise);
  return env;
}

export function useModels() {
  const { models: modelsPromise } = useApi();
  const models = use(modelsPromise);
  return models;
}

export function useProject() {
  const api = useApi();
  const project = use(api.project);
  return project;
}

export function useScripts() {
  const project = useProject();
  const scripts = (project?.scripts?.filter((s) => !s.isSystem && !s.unlisted) || []).sort((l, r) =>
    l.id.localeCompare(r.id),
  );
  return scripts;
}

export function useScript() {
  const scripts = useScripts();
  const { scriptid } = useScriptId();

  return scripts.find((s) => s.id === scriptid);
}
