import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

You can now use `GITHUB_TOKEN` from GitHub Actions to authenticate requests to [GitHub Models](https://github.com/marketplace/models)!!!

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

This simplifies your workflows by integrating AI capabilities directly into your actions, 
eliminating the need to generate and manage Personal Access Tokens (PATs)!

- [Read GitHub Announcement](https://github.blog/changelog/2025-04-14-github-actions-token-integration-now-generally-available-in-github-models/)
- [Read Documentation](/genaiscript/getting-started/configuration#github)