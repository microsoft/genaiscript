import { delay } from "@genaiscript/runtime";
import { browse } from "@genaiscript/plugin-playwright";

script({ model: "echo" });
const page = await browse("https://microsoft.github.io/genaiscript/reference/scripts/browser/", {
  headless: false,
  browser: "firefox",
});

const page2 = await browse("https://microsoft.github.io/genaiscript/reference/scripts/browser/", {
  headless: false,
  browser: "chromium",
});

await runPrompt(
  async (_) => {
    const page3 = await browse(
      "https://microsoft.github.io/genaiscript/reference/scripts/browser/",
      {
        headless: false,
      },
    );
  },
  { model: "echo" },
);

await delay(5000);
