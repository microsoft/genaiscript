script({
  responseSchema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        Model: {
          type: "string",
        },
        Type: {
          type: "string",
        },
        Tier: {
          type: "string",
        },
      },
    },
  },
});

const page = await host.browse(
  "https://learn.microsoft.com/en-us/azure/ai-foundry/model-inference/concepts/models",
  { waitUntil: "networkidle" },
);
const tables = await page.locator("table", { hasText: /Model/ }).all();
const content = await Promise.all(
  tables.map(async (t) => HTML.convertToMarkdown(await t.innerHTML())),
);

def(`TABLES`, content.join("\n\n"));
$`Extract the list of models supported by Azure AI Inference `;
