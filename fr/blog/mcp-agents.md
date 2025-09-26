import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Nous avons ajouté la prise en charge de la configuration des serveurs MCP dans les métadonnées des scripts et leur encapsulation avec des agents. Par conséquent, vous pouvez désormais exécuter plusieurs serveurs MCP en parallèle, chacun avec son propre agent.

```js "mcpAgentServers" wrap
script({
  title: "Wraps the playwright MCP server with an agent.",
  mcpAgentServers: {
    playwright: {
      description:
        "An agent that uses playwright to run browser commands.",
      command: "npx",
      args: ["--yes", "@playwright/mcp@latest", "--headless"],
      instructions:
        "Use the playwright tools as the Browser Automation Tools.",
    },
  },
});

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`;
```

## Vous voulez simplement des serveurs ?

Vous ne voulez pas utiliser l'abstraction des agents ? Vous pouvez également injecter directement le serveur MCP dans l'invite en utilisant le champ `mcpServers`.

```js title="mcpServers" wrap
script({
  title: "Uses playwright MCP tools.",
  mcpServers: {
    playwright: {
      command: "npx",
      args: ["--yes", "@playwright/mcp@latest", "--headless"],
    },
  },
});

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`;
```