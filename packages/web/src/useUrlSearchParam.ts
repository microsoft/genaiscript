// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useState, useEffect } from "react";
import { urlParams } from "./configuration";

export function useUrlSearchParams<T>(
  initialValues: T,
  fields: Record<string, JSONSchemaString | JSONSchemaNumber | JSONSchemaBoolean | JSONSchemaArray>,
) {
  const [state, setState] = useState<T>(initialValues);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newState: any = {};
    Object.entries(fields).forEach(([key, field]) => {
      const { type } = field;
      const value = params.get(key);
      if (value !== undefined && value !== null) {
        if (type === "string") {
          if (value !== "") newState[key] = value;
        } else if (type === "boolean")
          newState[key] = value === "1" || value === "yes" || value === "true";
        else if (type === "integer" || type === "number") {
          const parsed = type === "number" ? parseFloat(value) : parseInt(value);
          if (!isNaN(parsed)) newState[key] = parsed;
        } else if (type === "array") {
          const parsed = value.split(",").filter((s) => s !== "");
          if (parsed.length > 0) newState[key] = parsed;
        }
      }
    });
    setState(newState);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(urlParams);
    for (const key in state) {
      const field = fields[key];
      if (!field) continue;

      const { type } = field;
      const value = state[key];
      if (value === undefined || value === null) continue;
      if (type === "string") {
        if (value !== "") params.set(key, value as string);
      } else if (type === "boolean") {
        if (value) params.set(key, "1");
      } else if (type === "integer" || type === "number") {
        const v = value as number;
        if (!isNaN(v)) params.set(key, v.toString());
      } else if (type === "array") {
        const v = (value as string[]).filter((s) => s !== "");
        if (v.length) params.set(key, v.join(","));
      }
    }

    let url = "";
    if (params.toString()) url += `?${params.toString()}`;
    window.history.pushState({}, "", url);
  }, [state]);
  return [state, setState] as const;
}
