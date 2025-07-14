import {
  genaiscriptDebug,
  type PromptAmbientMessage,
  type PromptAmbientScript,
  type PromptAmbientDef,
  type PromptAmbientImportTemplate,
} from "@genaiscript/core";
const dbg = genaiscriptDebug("ambient");

function resolveAmbient<T>(name: string): T {
  dbg(`resolve %s`, name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (globalThis as any)[name];
  if (!fn) {
    throw new Error(
      "GenAIScript ambient function is only available through the genaiscript command line `run` command.",
    );
  }
  if (typeof fn !== "function") {
    throw new Error(
      `GenAIScript ambient function "${name}" is not a function, but ${typeof fn}. This is likely a bug in the GenAIScript runtime.`,
    );
  }
  return fn;
}

const script: PromptAmbientScript = (options) =>
  resolveAmbient<PromptAmbientScript>("script")(options);
const $: PromptAmbientMessage = (strings, ...args) =>
  resolveAmbient<PromptAmbientMessage>("$")(strings, ...args);
const def: PromptAmbientDef = (name, body, options) =>
  resolveAmbient<PromptAmbientDef>("def")(name, body, options);
const importTemplate: PromptAmbientImportTemplate = (files, args, options) =>
  resolveAmbient<PromptAmbientImportTemplate>("importTemplate")(files, args, options);

export { script, $, def, importTemplate };
