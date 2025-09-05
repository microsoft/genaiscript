import { delay } from "@genaiscript/runtime";
import { browse } from "@genaiscript/plugin-playwright";
script({
  model: "small",
  group: "browser",
});
const page = await browse("https://microsoft.github.io/genaiscript/", {
  headless: true,
  recordVideo: true,
});
await delay(1000);
await page.close();
const video = await page.video().path();
console.log(`video ${video}`);
