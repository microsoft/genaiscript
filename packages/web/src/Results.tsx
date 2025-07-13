// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, {
  startTransition,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Suspense from "./Suspense";
import Markdown from "./Markdown";
import { useRunClient } from "./RunClientContext";
import type { VscTabsSelectEvent } from "@vscode-elements/elements/dist/vscode-tabs/vscode-tabs";
import type {
  TreeItemIconConfig,
  TreeItem,
  VscTreeSelectEvent,
} from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";
import { ErrorBoundary } from "react-error-boundary";
import { convertAnnotationToItem } from "../../core/src/annotations";
import { renderMessagesToMarkdown } from "../../core/src/chatrender";
import type { ChatCompletionMessageParam } from "../../core/src/chattypes";
import { unmarkdown } from "../../core/src/cleaners";
import { rgbToCss, logprobColor, renderLogprob } from "../../core/src/logprob";
import { markdownDiff } from "../../core/src/mddiff";
import { fenceMD } from "../../core/src/mkmd";
import { roundWithPrecision } from "../../core/src/precision";
import { prettyDuration, prettyTokens, prettyCost } from "../../core/src/pretty";
import type { TraceNode, DetailsNode } from "../../core/src/traceparser";
import { parseTraceTree, renderTraceTree } from "../../core/src/traceparser";
import { diagnostics } from "./configuration";
import MarkdownPreviewTabs from "./MarkdownPreviewTabs";
import { RunClient } from "./RunClient";
import { useResult, useTrace, useRunner, useOutput } from "./RunnerContext";
import { useEventListener } from "./useEventListener";
import dedent from "dedent";
import { stringify as YAMLStringify } from "yaml";

import "@vscode-elements/elements/dist/vscode-tabs";
import "@vscode-elements/elements/dist/vscode-tab-header";
import "@vscode-elements/elements/dist/vscode-tab-panel";
import "@vscode-elements/elements/dist/vscode-badge";
import "@vscode-elements/elements/dist/vscode-scrollable";
import "@vscode-elements/elements/dist/vscode-collapsible";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-split-layout";

export function ResultsTabs() {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <vscode-tabs
        onvsc-tabs-select={(e: VscTabsSelectEvent) => setSelected(e.detail.selectedIndex)}
        panel
      >
        <OutputTabPanel selected={selected === 0} />
        <TraceTabPanel selected={selected === 1} />
        <MessagesTabPanel />
        <ProblemsTabPanel />
        <FileEditsTabPanel />
        <JSONTabPanel />
        <StatsTabPanel />
        <ErrorTabPanel />
        {diagnostics ? <RawTabPanel /> : undefined}
      </vscode-tabs>
    </>
  );
}

function OutputTabPanel(props: { selected?: boolean }) {
  const { selected } = props;
  return (
    <>
      <vscode-tab-header slot="header">
        Output
        <ChoicesBadge />
      </vscode-tab-header>
      <vscode-tab-panel>
        {selected ? <OutputMarkdown /> : null}
        <RunningPlaceholder />
      </vscode-tab-panel>
    </>
  );
}

function ErrorTabPanel() {
  const result = useResult();
  const { error } = result || {};
  if (!error) return null;
  return (
    <>
      <vscode-tab-header slot="header">Errors</vscode-tab-header>
      <vscode-tab-panel>
        <Markdown>{fenceMD(error?.message, "markdown")}</Markdown>
        <Markdown>{fenceMD(error?.stack, "txt")}</Markdown>
      </vscode-tab-panel>
    </>
  );
}

function ProblemsTabPanel() {
  const result = useResult();
  const { annotations = [] } = result || {};
  if (annotations.length === 0) return null;

  const annotationsMarkdown = annotations.map(convertAnnotationToItem).join("\n");

  return (
    <>
      <vscode-tab-header slot="header">
        Problems
        <CounterBadge title="number of errors, warnings found" collection={annotations} />
      </vscode-tab-header>
      <vscode-tab-panel>
        <Markdown>{annotationsMarkdown}</Markdown>
      </vscode-tab-panel>
    </>
  );
}

function ChatMessages(props: { messages: ChatCompletionMessageParam[] }) {
  const { messages = [] } = props;
  if (!messages.length) return null;
  const mdPromise = useMemo(
    () =>
      renderMessagesToMarkdown(messages, {
        textLang: "markdown",
        system: true,
        user: true,
        assistant: true,
      }),
    [messages],
  );
  const md = use(mdPromise);
  return (
    <>
      <Suspense>
        <Markdown copySaveButtons={true}>{md}</Markdown>
      </Suspense>
    </>
  );
}

function MessagesTabPanel() {
  const result = useResult();
  const { messages = [] } = result || {};
  if (!messages.length) return null;
  return (
    <>
      <vscode-tab-header slot="header">
        Chat
        <CounterBadge title="number of messages in chat" collection={messages} />
      </vscode-tab-header>
      <vscode-tab-panel>
        <ChatMessages messages={messages} />
      </vscode-tab-panel>
    </>
  );
}

function ErrorStatusBadge() {
  const result = useResult();
  const { status } = result || {};
  if (!status || status === "success") return null;
  return (
    <vscode-badge title="error" variant="counter" slot="content-after">
      !
    </vscode-badge>
  );
}

function StatsBadge() {
  const result = useResult() || {};
  const { usage } = result || {};
  if (!usage) return null;
  const { cost, prompt, completion, duration } = usage;
  if (!cost && !prompt && !completion && !duration) return null;
  return (
    <>
      {[
        duration > 0 ? prettyDuration(duration) : undefined,
        prompt > 0 ? prettyTokens(prompt) : undefined,
        prompt > 0 ? prettyTokens(completion) : undefined,
        cost > 0 ? prettyCost(cost) : undefined,
      ]
        .filter((l) => !!l)
        .map((s, i) => (
          <vscode-badge key={i} title="usage" variant="counter" slot="content-after">
            {s}
          </vscode-badge>
        ))}
    </>
  );
}

function StatsTabPanel() {
  const result = useResult();
  const { usage } = result || {};
  if (!usage) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cost, ...rest } = usage || {};

  const md = usage
    ? YAMLStringify(rest)
        .replace(/_/g, " ")
        .replace(/^(\s*)([a-z])/gm, (m, s, l) => `${s}- ${l}`)
    : "";
  return (
    <>
      <vscode-tab-header slot="header">
        Usage
        <StatsBadge />
      </vscode-tab-header>
      <vscode-tab-panel>{md ? <Markdown>{md}</Markdown> : null}</vscode-tab-panel>
    </>
  );
}

function LogProb(props: {
  value: Logprob;
  maxIntensity?: number;
  eatSpaces?: boolean;
  entropy?: boolean;
}) {
  const { value, maxIntensity, entropy, eatSpaces } = props;
  const { token, logprob, topLogprobs } = value;
  const c = rgbToCss(logprobColor(value, { entropy, maxIntensity }));
  const title = [
    renderLogprob(logprob),
    isNaN(value.entropy) ? undefined : `entropy: ${roundWithPrecision(value.entropy, 2)}`,
    topLogprobs?.length
      ? `top logprobs:\n${topLogprobs.map((t) => `-  ${t.token}: ${renderLogprob(t.logprob)}`).join("\n")}`
      : undefined,
  ]
    .filter((t) => !!t)
    .join("\n");

  let text = token;
  if (eatSpaces) text = text.replace(/\n/g, " ");
  return (
    <span className="logprobs" title={title} style={{ background: c }}>
      {text}
    </span>
  );
}

function LogProbsTabPanel() {
  const result = useResult();
  const { logprobs, perplexity } = result || {};
  if (!logprobs?.length) return null;
  return (
    <>
      <vscode-tab-header slot="header">
        Perplexity
        <ValueBadge title="perplexity" value={perplexity} precision={3} />
      </vscode-tab-header>
      <vscode-tab-panel>
        <div className={"markdown-body"}>
          {logprobs?.map((lp, i) => (
            <LogProb key={i} value={lp} />
          ))}
        </div>
      </vscode-tab-panel>
    </>
  );
}

function EntropyTabPanel() {
  const result = useResult();
  const { logprobs } = result || {};
  if (!logprobs?.length) return null;
  return (
    <>
      <vscode-tab-header slot="header">Entropy</vscode-tab-header>
      <vscode-tab-panel>
        <div className={"markdown-body"}>
          {logprobs?.map((lp, i) => (
            <LogProb key={i} value={lp} entropy={true} />
          ))}
        </div>
      </vscode-tab-panel>
    </>
  );
}

function TopLogProbsTabPanel() {
  const result = useResult();
  const { logprobs, uncertainty } = result || {};
  if (!logprobs?.length) return null;
  return (
    <>
      <vscode-tab-header slot="header">
        Uncertainty
        <ValueBadge value={uncertainty} title="uncertainty" precision={3} />
      </vscode-tab-header>
      <vscode-tab-panel>
        <div className={"markdown-body"}>
          {logprobs?.map((lp, i) => (
            <table key={i} className="toplogprobs">
              <tr>
                <td>
                  {lp.topLogprobs?.map((tlp, j) => (
                    <LogProb key={j} value={tlp} eatSpaces={true} />
                  ))}
                </td>
              </tr>
            </table>
          ))}
        </div>
      </vscode-tab-panel>
    </>
  );
}

function FileEditsTabPanel() {
  const result = useResult();
  const { fileEdits = {} } = result || {};

  const files = Object.entries(fileEdits);
  if (files.length === 0) return null;

  return (
    <>
      <vscode-tab-header slot="header">
        Edits
        <CounterBadge title="number of edited files" collection={files} />
      </vscode-tab-header>
      <vscode-tab-panel>
        <Markdown>
          {files
            ?.map(
              ([filename, content], i) =>
                dedent`### ${filename}
                    ${markdownDiff(content.before, content.after, { lang: "txt" })}
                    ${content.validation?.pathValid ? `- output path validated` : ""}
                    ${
                      content.validation?.schema
                        ? dedent`- JSON schema
                        \`\`\`json
                        ${JSON.stringify(content.validation.schema, null, 2)}
                        \`\`\``
                        : ""
                    }
                    ${content.validation?.schemaError ? `- error: ${content.validation.schemaError}` : ""}
                    `,
            )
            .join("\n")}
        </Markdown>
      </vscode-tab-panel>
    </>
  );
}

function JSONTabPanel() {
  const result = useResult();
  const { json, frames = [] } = result || {};
  if (json === undefined && !frames?.length) return null;
  return (
    <>
      <vscode-tab-header slot="header">
        Structured Output
        <CounterBadge title="number of generated JSON objects" collection={json} />
      </vscode-tab-header>
      <vscode-tab-panel>
        {json && (
          <Markdown filename="output.json" text={JSON.stringify(json, null, 2)}>
            {`
\`\`\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\`\`\`
`}
          </Markdown>
        )}
        {frames.map((frame, i) => (
          <Markdown key={i} filename="data.json" text={JSON.stringify(frame, null, 2)}>
            {`
\`\`\`\`\`json
${JSON.stringify(frame, null, 2)}
\`\`\`\`\`
`}
          </Markdown>
        ))}
      </vscode-tab-panel>
    </>
  );
}

function RawTabPanel() {
  const result = useResult();
  return (
    <>
      <vscode-tab-header slot="header">Raw</vscode-tab-header>
      <vscode-tab-panel>
        {result && (
          <Markdown>
            {`
\`\`\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`\`\`
`}
          </Markdown>
        )}
      </vscode-tab-panel>
    </>
  );
}

function ValueBadge(props: {
  value: any;
  precision?: number;
  title: string;
  render?: (value: any) => string;
}) {
  const { value, title, render, precision } = props;
  if (
    value === undefined ||
    value === null ||
    (typeof value === "number" && isNaN(value)) ||
    value === ""
  ) {
    return null;
  }
  const s = render ? render(value) : precision ? roundWithPrecision(value, precision) : "" + value;
  if (s === "") return null;
  return (
    <vscode-badge title={title} variant="counter" slot="content-after">
      {s}
    </vscode-badge>
  );
}

function CounterBadge(props: { collection: any | undefined; title: string }) {
  const { collection } = props;
  let count: string | undefined = undefined;
  if (Array.isArray(collection)) {
    if (collection.length > 0) count = "" + collection.length;
  } else if (collection) count = "1";

  return count ? (
    <vscode-badge variant="counter" slot="content-after">
      {count}
    </vscode-badge>
  ) : (
    ""
  );
}

const parseTreeIcons: TreeItemIconConfig = {
  leaf: "none",
  branch: "chevron-right",
  open: "chevron-down",
};

function traceTreeToTreeItem(node: TraceNode): TreeItem {
  if (typeof node === "string") return undefined;
  switch (node.type) {
    case "details":
      return {
        label: unmarkdown(node.label),
        value: node.id,
        icons: parseTreeIcons,
        open: node.open,
        subItems: node.content?.map(traceTreeToTreeItem)?.filter((s) => s),
      };
    case "item":
      return {
        label: unmarkdown(node.label),
        value: node.id,
        description: node.value,
      };
  }
}

function TraceTreeMarkdown() {
  const trace = useTrace();
  const { runId } = useRunner();
  const [node, setNode] = useState<TraceNode | undefined>(undefined);
  const openeds = useRef(new Set<string>());
  const tree = useMemo(() => {
    const res = parseTraceTree(trace, {
      parseItems: false,
      openeds: openeds.current,
    });
    openeds.current = new Set<string>(
      Object.values(res.nodes)
        .filter((n) => typeof n !== "string" && n.type === "details" && n.open)
        .map((n) => (n as DetailsNode).id),
    );
    return res;
  }, [trace]);
  const data = useMemo(() => {
    const newData = traceTreeToTreeItem(tree.root);
    newData.open = true;
    return [newData];
  }, [tree]);
  const treeRef = useRef(null);
  const handleSelect = (e: VscTreeSelectEvent) => {
    const { value, open } = e.detail;
    if (open) openeds.current.add(value);
    else openeds.current.delete(value);
    if (!value) return;
    const selected = tree.nodes[value];
    setNode(() => selected);
  };
  const preview = useMemo(() => {
    if (!node) return undefined;
    if (typeof node === "object" && node?.type === "details") {
      return node.content.map((n) => renderTraceTree(n, 2)).join("\n");
    }
    return renderTraceTree(node, 2);
  }, [node]);

  useEffect(() => {
    setNode(() => undefined);
  }, [runId]);

  return (
    <vscode-split-layout
      className="trace-split-panel"
      initial-handle-position="20%"
      fixed-pane="start"
    >
      <div slot="start">
        <vscode-scrollable>
          <vscode-tree
            data={data}
            ref={treeRef}
            indentGuides={true}
            onvsc-tree-select={handleSelect}
          />
        </vscode-scrollable>
      </div>
      <div slot="end">
        <vscode-scrollable>{preview ? <Markdown>{preview}</Markdown> : null}</vscode-scrollable>
      </div>
    </vscode-split-layout>
  );
}

function TraceTabPanel(props: { selected?: boolean }) {
  const { selected } = props;
  return (
    <>
      <vscode-tab-header slot="header">
        Trace
        <ErrorStatusBadge />
      </vscode-tab-header>
      <vscode-tab-panel>
        <ErrorBoundary fallback={<p>⚠️Something went wrong while rendering trace.</p>}>
          {selected ? <TraceTreeMarkdown /> : null}
        </ErrorBoundary>
      </vscode-tab-panel>
    </>
  );
}

function useReasoning() {
  const { client } = useRunClient();
  const [value, setValue] = useState<string>(client.reasoning);
  const appendReasoning = useCallback(
    () => startTransition(() => setValue(() => client.reasoning)),
    [client],
  );
  useEventListener(client, RunClient.PROGRESS_EVENT, appendReasoning);
  return value;
}

function OutputMarkdown() {
  const output = useOutput();
  const reasoning = useReasoning();
  if (!output && !reasoning) return null;

  let markdown = ``;
  if (reasoning) {
    markdown += `<details class="reasoning"><summary>🤔 thinking...</summary>\n${reasoning}\n</details>\n\n`;
  }
  if (output) markdown += output;
  return (
    <vscode-tabs className="output">
      <MarkdownPreviewTabs
        aiDisclaimer={true}
        filename="output.md"
        renderText={markdown}
        text={output}
      />
      <LogProbsTabPanel />
      <EntropyTabPanel />
      <TopLogProbsTabPanel />
    </vscode-tabs>
  );
}

function RunningPlaceholder() {
  const { state } = useRunner();
  if (state !== "running") return null;

  return <vscode-icon style={{ margin: "1rem" }} name="loading" spin spin-duration="1" />;
}

function ChoicesBadge() {
  const { choices } = useResult() || {};
  if (!choices?.length) return null;

  return (
    <vscode-badge title="choice" variant="default" slot="content-after">
      {choices.map((c) => c.token).join(", ")}
    </vscode-badge>
  );
}
