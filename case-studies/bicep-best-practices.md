import { Image } from 'astro:assets';
import { Code } from '@astrojs/starlight/components';
import bicepSource from "../../../../../packages/sample/src/bicep/web-app-basic-linux.bicep?raw"
import scriptSource from "../../../../../packages/sample/genaisrc/bicep-best-practices.genai.mjs?raw"
import src from './bicep-best-practices.png';
import alt from "./bicep-best-practices.png.txt?raw"

[Azure Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep) is a Domain Specific Language (DSL) for deploying Azure resources declaratively. 
It is a language that is designed to be a more readable 
and maintainable way to define Azure resources. 

Bicep comes with a [linter](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/linter) that detects various faults, but also comes with
online best practices which are not completely covered by the linter.

## Web App Basic Linux

The following is a Bicep file that deploys a web app with a Linux app service plan.
It is the **microsoft.web/webapp-basic-linux/main.bicep** 
sample template in the [bicep playground](https://azure.github.io/bicep/).

<Code code={bicepSource} wrap={true} lang="bicep" title="web-app-basic-linux.bicep" />

## Script

The file is `linter` clean, but some improvements could be made with best practices.
The following script will apply best practices to the Bicep file.

<Code code={scriptSource} wrap={true} lang="js" title="bicep-best-practices.genai.mjs" />

- line numbers are added to the file content to help the LLM precisely locate the issues.

```js "lineNumbers"
def("FILE", env.files, { endsWith: ".bicep", lineNumbers: true })
```

- the script uses a builtin support for [annotations](/genaiscript/reference/scripts/annotations) 
to generate parseable warnings and errors. Annotations are automatically integrated as problems 
in VSCode or as build errors in the CI/CD pipeline.

```js "annotations"
$`... and generate annotations ...`
```

- added support to ignore false positives using the `#disable-next-line genaiscript`
comment

```js wrap
$`- If a line starts with "#disable-next-line genaiscript", ignore the next line.`
```

- GPT-4 already knows about the best practices for Bicep, no need to repeat them!

## Results

The LLM generates 3 annotations for the Bicep file. The annotations are surfaced 
as squiggly lines in VSCode.

<Image src={src} alt={alt} />