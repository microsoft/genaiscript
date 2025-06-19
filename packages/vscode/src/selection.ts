import * as vscode from "vscode";

export function getSelectedText() {
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) return undefined;

  const selection = textEditor.selection;
  if (!selection) return undefined;

  // get selected text
  const selectedText = textEditor.document.getText(selection);
  return selectedText;
}
