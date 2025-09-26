Le [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) définit un protocole pour partager des [outils](https://modelcontextprotocol.io/docs/concepts/tools)
et les consommer indépendamment du framework ou du runtime sous-jacent.

GenAIScript vous permet de démarrer et d'interagir de manière programmable avec un serveur Model Context Protocol (MCP),
d’invoquer des outils et de résoudre des ressources. Bien que cela soit généralement réservé à l'orchestration des LLM, il peut également être utile d’utiliser JavaScript pour effectuer quelques appels à des serveurs avant de faire une requête.

Cette fonctionnalité est fournie comme une couche légère par-dessus le SDK TypeScript MCP.

## Mais pourquoi ne pas simplement utiliser des API ?

Choisissez le meilleur outil pour la tâche. Dans de nombreux cas, les API sont plus simples, plus légères et plus rapides à utiliser que les MCP, et vous pouvez tirer parti de la puissance de Node.js pour faire presque tout.

Cependant, les MCP sont des API emballées pour une consommation facile par les clients LLM. Leurs auteurs les ont conçues pour être faciles à utiliser et pertinentes lorsqu’on travaille avec des LLM.

Par exemple, lors de la consommation d’outils Python depuis GenAIScript, vous pourriez rencontrer des problèmes avec l’exécution Python ou le versionnage des paquets
si vous essayez de les exécuter directement (et cela peut être peu sûr). Avec les MCP, il y a souvent une version containerisée de l’outil prête à être utilisée.

## Démarrage d’un serveur

Vous démarrez un serveur en utilisant la même syntaxe que les fichiers de configuration MCP, mais vous devez fournir un identifiant pour le serveur.
Cet identifiant est utilisé pour référencer le serveur dans le `mcpClient`.

```js
const fs = await host.mcpServer({
  id: "filesystem",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", path.resolve(".")],
});
```

Le serveur est automatiquement arrêté lorsque l’invite se termine.

## Outils

Vous pouvez effectuer des opérations sur les outils. Les requêtes ne sont pas mises en cache et communiquent toujours avec le serveur.

* Lister les outils (métadonnées) :

  ```js
  const tools = await fs.listTools();
  ```

* Appeler un outil :

  ```js
  const res = await fs.callTool("get_file_info", { path: "README.md" });
  ```

* Utiliser le résultat :

  ```js
  const info = res.content[0].text;
  ```

La structure de la sortie dépend de l’outil, mais elle est conçue pour être consommée par un LLM. Vous souhaiterez probablement utiliser `def` pour le stocker dans votre invite :

```js
def("INFO", info);
```

## Exemple : Transcription YouTube

Le serveur MCP [mcp/youtube-transcript](https://hub.docker.com/r/mcp/youtube-transcript) peut extraire la transcription
d'une vidéo YouTube. Il est répertorié dans le [catalogue Docker MCP](https://hub.docker.com/u/mcp).

```js
const yt = await host.mcpServer({
  id: "youtube_transcript",
  command: "docker",
  args: ["run", "-i", "--rm", "mcp/youtube-transcript"],
});

const url = "https://youtu.be/ENunZe--7j0";
const transcript = await yt.callTool("get_transcript", { url });
console.log(`transcript: ${transcript.text}`);
```

## Partage des MCP

Par défaut, les serveurs MCP ne sont pas partagés entre les invites. Si vous voulez utiliser le même serveur MCP dans plusieurs invites,
vous pouvez utiliser la fonction `host.mcpClient` pour créer un client qui peut être réutilisé dans plusieurs invites.

Vous pouvez également obtenir des outils sous une forme qui peut être utilisée dans `defTool` et les réutiliser dans plusieurs invites :

```js
const tools = await fs.listToolCallbacks();

await runPrompt((ctx) => {
  for (const tool of tools) ctx.defTool(tools);
  ctx....
});
```