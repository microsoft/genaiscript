import debug, { Debugger } from "debug";

const _genaiscriptDebug = debug("genaiscript");
export function genaiscriptDebug(namespace: string): Debugger {
  return _genaiscriptDebug.extend(namespace);
}
