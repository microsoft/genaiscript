// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { createContext, useMemo, useEffect, use, startTransition, useState } from "react";
import { base, apiKey } from "./configuration";
import { RunClient } from "./RunClient";
import { CHANGE } from "../../core/src/constants";

export const RunClientContext = createContext<{
  client: RunClient;
} | null>(null);

export function RunClientProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    const client = new RunClient(`${base}/${apiKey ? `?api-key=${apiKey}` : ""}`);
    client.addEventListener("error", (err) => console.error(err), false);
    return client;
  }, []);
  useEffect(() => {
    client.init();
  }, [client]);

  return (
    <RunClientContext.Provider
      value={{
        client,
      }}
    >
      {children}
    </RunClientContext.Provider>
  );
}

export function useRunClient() {
  const ctx = use(RunClientContext);
  if (!ctx) throw new Error("missing run client context");
  return ctx;
}

export function useClientReadyState() {
  const { client } = useRunClient();
  const [state, setState] = useState(client?.readyState);
  useEffect(() => {
    if (!client) return undefined;
    const update = () => startTransition(() => setState(client.readyState));
    client.addEventListener(CHANGE, update, false);
    return () => client.removeEventListener(CHANGE, update);
  }, [client]);
  return state;
}
