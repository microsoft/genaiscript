// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { createContext, use } from "react";
import { useLocationHashValue } from "./useLocationHashValue";

export const ScriptContext = createContext<{
  scriptid: string | undefined;
  setScriptid: (id: string) => void;
} | null>(null);

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [scriptid, setScriptid] = useLocationHashValue("scriptid");

  return (
    <ScriptContext.Provider
      value={{
        scriptid,
        setScriptid,
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
}

export function useScriptId() {
  const api = use(ScriptContext);
  if (!api) throw new Error("missing script id context");
  return api;
}
