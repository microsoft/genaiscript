// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from "react";
import "@vscode-elements/elements/dist/vscode-table";
import "@vscode-elements/elements/dist/vscode-table-header";
import "@vscode-elements/elements/dist/vscode-table-body";
import "@vscode-elements/elements/dist/vscode-table-row";
import "@vscode-elements/elements/dist/vscode-table-header-cell";
import "@vscode-elements/elements/dist/vscode-table-cell";

export default function DataTable(props: { rows: Record<string, number>[]; headers: string[] }) {
  const { rows, headers } = props;
  if (!rows?.length || !headers?.length) return null;

  return (
    <vscode-table zebra borderedRows resizable responsive>
      <vscode-table-header slot="header">
        {headers.map((header) => (
          <vscode-table-header-cell key={header}>{header}</vscode-table-header-cell>
        ))}
      </vscode-table-header>
      <vscode-table-body slot="body">
        {rows.map((row, index) => (
          <vscode-table-row key={index}>
            {headers.map((header) => (
              <vscode-table-cell key={header}>{row[header]}</vscode-table-cell>
            ))}
          </vscode-table-row>
        ))}
      </vscode-table-body>
    </vscode-table>
  );
}
