import "@genaiscript/runtime";

export async function writePoem() {
  const res = await prompt`write a poem`.options({ model: "echo" });
  return res.text;
}
