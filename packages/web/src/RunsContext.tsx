// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { createContext, useState, useMemo, use, useContext } from "react";
import { RunResultListResponse } from "../../core/src/server/messages";
import { fetchRuns } from "./api";

export const RunsContext = createContext<{
  runs: Promise<RunResultListResponse | undefined>;
  refresh: () => void;
} | null>(null);

export function RunsProvider({ children }: { children: React.ReactNode }) {
  const [refreshId, setRefreshId] = useState(0);
  const runs = useMemo<Promise<RunResultListResponse>>(fetchRuns, [refreshId]);
  const refresh = () => setRefreshId((prev) => prev + 1);

  return (
    <RunsContext.Provider
      value={{
        refresh,
        runs,
      }}
    >
      {children}
    </RunsContext.Provider>
  );
}

export function useRunResults() {
  const { runs: runsPromise } = useContext(RunsContext);
  const runs = use(runsPromise);
  return runs;
}
