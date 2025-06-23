// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import { JSON5TryParse } from "../../core/src/json5";

import "@vscode-elements/elements/dist/vscode-tabs";
import "@vscode-elements/elements/dist/vscode-tab-header";
import "@vscode-elements/elements/dist/vscode-tab-panel";

import LineChart from "./LineChart";
import BarChart from "./BarChart";
import DataTable from "./DataTable";

export default function DataTableTabs(props: { children: string; chart?: string }) {
  const { children, chart } = props;
  const rows: any[] = JSON5TryParse(children);

  // find rows that are numbers
  if (!rows?.length && typeof rows[0] !== "object") return null;
  const headers = Object.keys(rows[0]);

  if (headers.length < 2) return null;

  return (
    <vscode-tabs>
      <vscode-tab-header>Chart</vscode-tab-header>
      <vscode-tab-panel>
        {chart === "language-barchart" ? <BarChart rows={rows} headers={headers} /> : null}
        {chart === "language-linechart" ? <LineChart rows={rows} headers={headers} /> : null}
      </vscode-tab-panel>
      <vscode-tab-header>Data</vscode-tab-header>
      <vscode-tab-panel>
        <DataTable rows={rows} headers={headers} />
      </vscode-tab-panel>
    </vscode-tabs>
  );
}
