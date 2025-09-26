Commande interactive pour configurer et valider les connexions LLM.

## LLMs

L’action `configure llm` vous permet de configurer et de valider les connexions LLM. Cela est utile pour garantir que votre application peut communiquer avec les LLMs que vous souhaitez utiliser.

```bash
genaiscript configure llm
```

## Action GitHub

L’action `configure action` génère la structure de fichiers pour publier un script en tant que [action GitHub personnalisée en conteneur](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action).

```bash
genaiscript configure action <my-script-id>
```

La plupart des métadonnées de l'action sont extraites du script lui-même, vous n’avez qu’à fournir le nom du script. Elle exporte les fichiers générés dans `.genaiscript/action/<script-id>` par défaut, mais vous pouvez modifier cela lors de la mise à jour d’un projet d’action existant.