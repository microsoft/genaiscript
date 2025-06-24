import { prompt } from "@genaiscript/runtime";

export async function writePoem() {
  const res = await prompt`write a poem`;
  return res.text;
}
