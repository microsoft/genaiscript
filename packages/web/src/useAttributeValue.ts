// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useEffect, useState } from "react";

export function useAttributeValue(el: HTMLElement, name: string) {
  const [value, setValue] = useState(el.getAttribute(name));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setValue(el.getAttribute(name));
    });
    observer.observe(el, { attributes: true });
    return () => observer.disconnect();
  }, [el, name]);
  return value;
}
