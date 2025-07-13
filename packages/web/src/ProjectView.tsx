// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useMemo } from "react";
import Suspense from "./Suspense";
import { useEnv } from "./ApiContext";
import Markdown from "./Markdown";

import "@vscode-elements/elements/dist/vscode-collapsible";
import "@vscode-elements/elements/dist/vscode-badge";

export function ProjectView() {
  return (
    <vscode-collapsible title={"Project"}>
      <Suspense>
        <ProjectHeader />
      </Suspense>
    </vscode-collapsible>
  );
}

function ProjectHeader() {
  const env = useEnv();
  const { remote, configuration } = env || {};
  const { name, description, version, homepage, author, readme } = configuration || {};
  if (!configuration) return null;

  const { url, branch } = remote || {};
  const remoteSlug = url ? `${url}${branch ? `#${branch}` : ""}` : undefined;

  const markdown = useMemo(() => {
    const res: string[] = [
      !!remoteSlug && `- remote: [${remoteSlug}](https://github.com/${remoteSlug})`,
      readme || description,
    ];
    return res.filter((s) => !!s).join("\n");
  }, [description, remoteSlug, version, readme]);

  return (
    <>
      {remoteSlug ? (
        <vscode-badge variant="counter" slot="decorations">
          {remoteSlug}
        </vscode-badge>
      ) : null}
      {markdown ? (
        <div className="readme">
          <Markdown readme={true}>{markdown}</Markdown>
        </div>
      ) : null}
    </>
  );
}
