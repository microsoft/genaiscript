import * as vscode from "vscode";
import { templateGroup } from "../../core/src/ast";
import { groupBy } from "../../core/src/util";
import { TemplateQuickPickItem } from "./parameterquickpick";

export function scriptsToQuickPickItems(
  templates: PromptScript[],
  options?: { create?: boolean },
): TemplateQuickPickItem[] {
  const { create } = options || {};
  const cats = groupBy(templates, templateGroup);
  const items: vscode.QuickPickItem[] = [];
  for (const cat in cats) {
    items.push(<vscode.QuickPickItem>{
      label: cat,
      kind: vscode.QuickPickItemKind.Separator,
    });
    items.push(
      ...cats[cat].map(
        (template) =>
          <TemplateQuickPickItem>{
            label:
              template.title ??
              (template.filename && vscode.workspace.asRelativePath(template.filename)) ??
              template.id,
            description: `${template.id} ${template.description || ""}`,
            template,
          },
      ),
    );
  }
  if (create) {
    items.push(<vscode.QuickPickItem>{
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
    });
    items.push(<TemplateQuickPickItem>{
      label: "Create a new GenAIScript script...",
      description: "Create a new script script in the current workspace.",
      action: "create",
    });
  }
  return items;
}
