// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from "react";

import "@vscode-elements/elements/dist/vscode-button";
import AIDisclaimer from "./AIDisclaimer";
import { hosted } from "./configuration";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextFromChildren(children: any): string {
  if (!children) return "";

  return React.Children.toArray(children).reduce((text, child) => {
    if (typeof child === "string") {
      return text + child;
    } else if (React.isValidElement(child)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return text + extractTextFromChildren((child.props as any).children);
    }
    return text;
  }, "") as string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CopyButton(props: { children: any; text?: string }) {
  const { children, text } = props;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const res = text || extractTextFromChildren(children); // TODO: keep upstream text somewhere?
      await navigator.clipboard.writeText(res);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const title = copied ? "Copied!" : "Copy";
  const buttonText = copied ? "Copied!" : "";
  return (
    <vscode-button aria-label="Copy" icon="copy" secondary onClick={handleCopy} title={title}>
      {buttonText}
    </vscode-button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SaveButton(props: { filename?: string; children: any; text?: string }) {
  const { children, text, filename } = props;
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      const res = text || extractTextFromChildren(children); // TODO: keep upstream text somewhere?
      const blob = new Blob([res], { type: "text/plain" });
      let url: string;
      let a: HTMLAnchorElement;
      try {
        url = URL.createObjectURL(blob);
        a = document.createElement("a");
        a.href = url;
        a.download = filename || "code.txt";
        document.body.appendChild(a);
        a.click();
      } finally {
        if (a) document.body.removeChild(a);
        if (url) URL.revokeObjectURL(url);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };
  const title = saved ? "Saved!" : "Save";
  return (
    <vscode-button
      aria-label="Save to file"
      icon="save"
      secondary
      onClick={handleSave}
      title={title}
    />
  );
}

export default function CopySaveButtons(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
  filename?: string;
  text?: string;
  aiDisclaimer?: boolean;
}) {
  const { children, text, aiDisclaimer } = props;
  if (!children?.length && !text) return null;
  return (
    <div className="buttons">
      <CopyButton {...props} />
      {!hosted ? <SaveButton {...props} /> : null}
      {aiDisclaimer ? <AIDisclaimer /> : null}
    </div>
  );
}
