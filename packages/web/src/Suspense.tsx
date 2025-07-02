// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { Suspense as ReactSuspense } from "react";

import "@vscode-elements/elements/dist/vscode-icon";

export default function Suspense(props: { children: React.ReactNode }) {
  return (
    <ReactSuspense fallback={<vscode-icon name="loading" spin spin-duration="1"></vscode-icon>}>
      {props.children}
    </ReactSuspense>
  );
}
