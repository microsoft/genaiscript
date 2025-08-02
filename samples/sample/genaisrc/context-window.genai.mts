import { detectContextWindow } from "@genaiscript/runtime";

const { output } = env;
const models = ["large", "small", "tiny"];
for (const model of models) {
  output.heading(3, model);
  const info = await detectContextWindow(model);
  output.itemValue(`size`, info.contextWindow);
  output.fence(info, "yaml");
}
