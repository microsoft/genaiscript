import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

:::warn
Agentic tools are no longer supported.
:::

[Agentic](https://agentic.so/) est une bibliothèque standard d'outils d'IA en TypeScript optimisée à la fois pour une utilisation en TS et pour une utilisation basée sur LLM, ce qui est vraiment important pour les tests et le débogage.

Agentic prend en charge une variété d'API en ligne, comme Bing, Wolfram Alpha, Wikipedia, et bien plus. Vous pouvez enregistrer n'importe quel [outil Agentic](https://agentic.so/tools/) dans votre script en utilisant `defTool`. Voici un exemple d'utilisation de l'outil Weather :

```js
import { WeatherClient } from "@agentic/weather";
const weather = new WeatherClient();
defTool(weather);
```

* [Documentation Agentic](https://agentic.so/sdks/genaiscript)
* [Documentation GenAIScript](https://microsoft.github.io/genaiscript/guides/agentic-tools/)