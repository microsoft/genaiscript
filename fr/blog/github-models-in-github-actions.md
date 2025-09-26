import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Vous pouvez désormais utiliser `GITHUB_TOKEN` de GitHub Actions pour authentifier les requêtes vers [GitHub Models](https://github.com/marketplace/models) !!!

```yaml title="genai.yml" wrap "models: read" "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
permissions:
  models: read
jobs:
  genai:
    steps:
      run: npx -y genaiscript run ...
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Cela simplifie vos workflows en intégrant directement les capacités d'IA dans vos actions, supprimant ainsi le besoin de générer et de gérer des jetons d'accès personnels (PAT) !

* [Lire l'annonce GitHub](https://github.blog/changelog/2025-04-14-github-actions-token-integration-now-generally-available-in-github-models/)
* [Lire la documentation](../../configuration/github/)