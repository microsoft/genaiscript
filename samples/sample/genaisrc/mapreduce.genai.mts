import { mapPrompt, reducePrompt } from "@genaiscript/runtime";
script({
  files: "src/large/llama2.pdf",
});
const { output } = env;
const chunks = (await tokenizers.chunk(env.files[0])).slice(0, 3);

const maps = await mapPrompt(
  chunks,
  (ctx, chunk) => ctx.$`Summarize ${chunk}`,
  (res) => res.text,
  { cache: true },
);
output.fence(maps, "yaml");

const reduced = await reducePrompt<TextChunk, string>(
  chunks,
  (ctx, reduced, chunk) =>
    ctx.$`Summarize a large document split in chunks. The current chunk is ${chunk} and the rolling summary is ${reduced || ""}.`,
  (reduced, chunk, res) => res.text,
  "",
  { cache: true },
);
output.fence(reduced, "text");
