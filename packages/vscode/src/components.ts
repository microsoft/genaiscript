import { ExtensionContext } from "vscode";

export function dispose(context: ExtensionContext, o: { dispose: () => void }) {
  if (!o) return;

  o.dispose();
  let i = context.subscriptions.indexOf(o);
  if (i > -1) context.subscriptions.splice(i, 1);
}
