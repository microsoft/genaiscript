// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

export function useLocationHashValue(name: string): ReturnType<typeof useState<string | null>> {
  const read = () => new URLSearchParams(window.location.hash.slice(1)).get(name);
  const [value, setValue] = useState(read);
  useEffect(() => {
    const listener = () => setValue(read);
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, [name]);

  // This setter will update the URL hash with the new value
  const setter: Dispatch<SetStateAction<string>> = (updater) => {
    const newValue = typeof updater === "function" ? updater(read()) : updater;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (newValue === null || newValue === undefined || newValue === "") params.delete(name);
    else params.set(name, String(newValue));
    window.location.hash = params.toString();
  };
  return [value, setter];
}
