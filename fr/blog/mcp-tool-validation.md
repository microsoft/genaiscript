import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

GenAIScript a ajouté plusieurs fonctionnalités pour sécuriser les outils du protocole Model Context (MCP) et atténuer des attaques spécifiques telles que le rug pull, l’empoisonnement d’outils ou l’injection de prompt.

À partir de la `v1.127`, vous pouvez configurer les options suivantes comme [documenté ici](../../reference/scripts/mcp-tools#security/) :

* hachage de la signature des outils pour prévenir les attaques de rug pull, où la liste des outils est modifiée sans que vous le sachiez.

```js 'toolsSha: "..."'
script({
    mcpServers: {
        playwright: {
            ...,
            toolsSha: "..."
        }
    }
})
```

* détection d’injection de prompt utilisant un [scanner de sécurité du contenu](../../reference/scripts/content-safety/). Cela analysera à la fois le fichier de définition des outils, pour éviter **l’empoisonnement d’outils**, et chaque sortie d’outil, pour prévenir **l’injection de prompt**.

```js 'detectPromptInjection: "always"'
script({
    mcpServers: {
        playwright: {
            ...,
            detectPromptInjection: "always"
        }
    }
})
```

* en fait, chaque outil peut être instrumenté avec une analyse de sécurité du contenu.

```js 'detectPromptInjection: "always"'
defTool("fetch", "Fetch a URL", { url: { type: "string" }, },
    async args => ..., {
    detectPromptInjection: "always"
})
```

### Avons-nous terminé ?

Il reste encore de nombreux autres aspects de sécurité à considérer lors de l’utilisation des outils MCP, ces fonctionnalités n’en sont que quelques-unes.