import * as vscode from "vscode";
import { ExtensionState } from "./state";
import { registerCommand } from "./commands";
import { TYPE_DEFINITION_BASENAME, TYPE_DEFINITION_REFERENCE } from "../../core/src/constants";
import { promptDefinitions } from "../../core/src/default_prompts";
import { createFetch } from "../../core/src/fetch";

export function activateFixCommand(state: ExtensionState) {
  const { context } = state;
  const { subscriptions } = context;

  const fixGist = async (file: vscode.Uri) => {
    // Extract the gist ID from the URI
    const gistId = file.authority;
    if (!gistId) {
      vscode.window.showErrorMessage("Unable to determine gist ID from URI");
      return;
    }

    const session = await vscode.authentication.getSession("github", ["gist"], {
      createIfNone: true,
    });
    if (!session) {
      vscode.window.showErrorMessage("Failed to authenticate with GitHub");
      return;
    }

    // Show progress notification
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Updating gist...",
        cancellable: false,
      },
      async () => {
        // Use the GitHub REST API to update the gist
        const fetch = await createFetch();
        const res = await fetch("https://api.github.com/gists/" + gistId, {
          method: "PATCH",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${session.accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            files: {
              [TYPE_DEFINITION_BASENAME]: {
                content: promptDefinitions[TYPE_DEFINITION_BASENAME],
              },
              "tsconfig.json": {
                content: promptDefinitions["tsconfig.json"],
              },
            },
          }),
        });
        if (!res.ok) {
          vscode.window.showErrorMessage(`Failed to update gist: ${res.statusText}`);
          return;
        } else {
          await vscode.commands.executeCommand("gistpad.refreshGists");
        }
      },
    );

    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document?.uri?.toString() === file.toString(),
    );
    if (editor) {
      const text = editor.document.getText();
      if (!text.startsWith(TYPE_DEFINITION_REFERENCE)) {
        // Insert the TYPE_DEFINITION_REFERENCE at the top of the document
        const position = new vscode.Position(0, 0);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, position, TYPE_DEFINITION_REFERENCE);
        await vscode.workspace.applyEdit(edit);
        await editor.document.save();
      }
    }
  };

  const fragmentFix = async (file: vscode.Uri) => {
    if (file?.scheme === "gist") {
      await fixGist(file);
    } else {
      await state.cancelAiRequest();
      await state.parseWorkspace();
    }
  };

  subscriptions.push(registerCommand("genaiscript.fragment.fix", fragmentFix));
}
