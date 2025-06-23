// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DependencyList, useEffect } from "react";

export function useEventListener(
  target: EventTarget | undefined,
  eventName: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions,
  deps?: DependencyList,
) {
  useEffect(() => {
    target?.addEventListener(eventName, handler, options);
    return () => target?.removeEventListener(eventName, handler, options);
  }, [target, eventName, handler, JSON.stringify(options), ...(deps || [])]);
}
