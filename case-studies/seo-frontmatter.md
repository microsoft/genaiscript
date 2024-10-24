
import { Code, Steps } from '@astrojs/starlight/components';
import importedCode from "../../../../genaisrc/frontmatter.genai.mjs?raw"

Generating and maintaining good SEO front matter fields can be a tedious task. 
GenAIScript can help you automate this process.

The script below will generate SEO information
and update the existing file. The script uses a custom merge strategy 
to merge the new front matter with the existing front matter.

<Code code={importedCode} wrap={true} lang="js" title="slides.genai.mjs" />

## Batching over all files

Once the script has been tuned on a few files, you can automate using
the [CLI](/genaiscript/reference/cli). The CLI has a **--apply-edits** flag to apply the changes to the file.

```sh
for file in src/**/*.md; do
  npx --yes genaiscript run frontmatter "$file" --apply-edits
```

You can run this command in your CI/CD pipeline to keep your SEO front matter up to date.

:::tip

Add this command to your `package.json` to make it easier to run again.

```json title="package.json"
{
  ...
  "scripts": {
    "genai:frontmatter": "for file in \"src/**/*.md\"; do\ngenaiscript run frontmatter \"$file\" --apply-edits\ndone",
  }
}
```

:::