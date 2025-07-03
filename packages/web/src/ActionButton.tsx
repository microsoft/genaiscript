// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type React from "react";

import "@vscode-elements/elements/dist/vscode-icon";

export function ActionButton(props: {
  name: string;
  label: string;
  onClick: (e: React.UIEvent) => void;
}) {
  const { onClick, name, label } = props;
  const handleClick = (e: React.UIEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <vscode-icon
      tabIndex={0}
      name={name}
      action-icon
      label={label}
      onClick={handleClick}
      onKeyDown={handleClick}
      slot="actions"
    />
  );
}
