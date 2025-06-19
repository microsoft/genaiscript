import * as vscode from "vscode";
import { ExtensionState } from "./state";
import { NotSupportedError } from "../../core/src/error";
import { promptParameterTypeToJSONSchema } from "../../core/src/parameters";

export interface TemplateQuickPickItem extends vscode.QuickPickItem {
  template?: PromptScript;
  action?: "create";
}

export async function showPromptParametersQuickPicks(
  script: PromptScript,
  defaultValues?: PromptParameters,
): Promise<PromptParameters> {
  const parameters: PromptParameters = structuredClone(defaultValues || {});
  if (!script?.parameters) return parameters;

  const params = script.parameters || {};

  for (const param in params) {
    if (parameters[param] !== undefined) continue;

    const schema = promptParameterTypeToJSONSchema(script.parameters[param]);
    switch (schema.type) {
      case "string": {
        let value: string | undefined;
        const enums = schema.enum;
        const uiSuggestions = schema.uiSuggestions;
        if (enums?.length) {
          const res = await vscode.window.showQuickPick(
            enums.map((e) => ({
              label: e,
              description: e,
            })),
            {
              title: `Choose ${schema.title || param} ${schema.description || ""}`,
              placeHolder: schema.default,
              canPickMany: false,
            },
          );
          value = res?.label;
        } else if (uiSuggestions) {
          const custom = "Enter a custom value";
          const res = await vscode.window.showQuickPick(
            [
              ...uiSuggestions.map((e) => ({
                label: e,
                description: e,
              })),
              {
                label: custom,
                description: "Enter a custom value not in the suggestions.",
              },
            ],
            {
              title: `Choose ${schema.title || param} ${schema.description || ""}`,
              placeHolder: schema.default,
              canPickMany: false,
            },
          );
          value = res?.label;
          if (value === custom) {
            value = await vscode.window.showInputBox({
              title: `Enter value for ${schema.title || param}`,
              value: schema.default,
              prompt: schema.description,
            });
          }
          if (value === undefined) return undefined;
        } else {
          value = await vscode.window.showInputBox({
            title: `Enter value for ${schema.title || param}`,
            value: schema.default,
            prompt: schema.description,
          });
        }
        if (value === undefined) return undefined;
        parameters[param] = value;
        break;
      }
      case "boolean": {
        const value = await vscode.window.showQuickPick([{ label: "yes" }, { label: "no" }], {
          title: `Choose ${schema.title || param} ${schema.description || ""}`,
          canPickMany: false,
        });
        if (value === undefined) return undefined;
        parameters[param] = value.label === "yes";
        break;
      }
      case "integer":
      case "number": {
        const parse = schema.type === "integer" ? parseInt : parseFloat;
        const value = await vscode.window.showInputBox({
          title: `Enter ${schema.type} value for ${schema.title || param}`,
          value: schema.default?.toString(),
          prompt: schema.description,
          validateInput: (v) => {
            v = v.trim();
            const x = parse(v);
            const msg = isNaN(x) || String(x) !== v ? `Enter a valid, finite ${schema.type}` : null;
            return msg;
          },
        });
        if (value === undefined) return undefined;
        parameters[param] = parse(value);
        break;
      }
      default:
        throw new NotSupportedError("Unsupported parameter type " + schema.type);
    }
  }
  return parameters;
}
