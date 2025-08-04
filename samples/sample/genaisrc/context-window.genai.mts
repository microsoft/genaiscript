import { detectContextWindow } from "@genaiscript/runtime";

const { output } = env;
const models = ["large", "small", "tiny"];
for (const model of models) {
  const { promptTokens } = await detectContextWindow(model);
  output.itemValue(model, promptTokens);
}
