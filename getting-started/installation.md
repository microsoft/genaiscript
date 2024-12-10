
import { Image } from "astro:assets"
import { FileTree } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"

import extensionViewSrc from "../../../assets/vscode-extensions-view.png"
import extensionViewAlt from "../../../assets/vscode-extensions-view.png.txt?raw"

import marketplaceSrc from "../../../assets/vscode-marketplace.png"
import marketplaceAlt from "../../../assets/vscode-marketplace.png.txt?raw"

import vscodeViewSrc from "../../../assets/vscode-genaiscript-view.png"
import vscodeViewAlt from "../../../assets/vscode-genaiscript-view.png.txt?raw"

GenAiScript is available as a [command line](#command-line) or a [Visual Studio Code Extension](#visual-studio-code-extension).

## Node.JS

GenAiScript requires [Node.JS](https://nodejs.org/) to run.
We recommend installing the LTS version using a [node version manager](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

<Steps>

<ol>

<li>

Install Node.JS (node) [with a package manager](https://nodejs.org/en/download/package-manager).

</li>

<li>

Check your installation

```sh
node -v
npx -v
```

You should see something similar or higher than the following versions:

```text
v20.11.1
10.5.0
```

</li>

</ol>

</Steps>

## Visual Studio Code Extension

The [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode)
contains the latest stable release of the [extension](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode).

<Steps>

<ol>

<li>

Install [Visual Studio Code](https://code.visualstudio.com/Download).

Visual Studio Code is a lightweight but powerful source code editor which runs on your desktop and is available for Windows, macOS and Linux.

</li>

<li>
Open your project folder in Visual Studio Code.

</li>
<li>
Click on the **Extensions** view

<Image src={extensionViewSrc} alt={extensionViewAlt} />

</li>
<li>

Search **genaiscript** and click **Install**.

<Image src={marketplaceSrc} alt={marketplaceAlt} />

</li>

<li>

If successful, you will see the icon in the **Extensions** view.

<Image src={vscodeViewSrc} alt={vscodeViewAlt} />

</li>

<li>

(Optional) Click on the ⚙️ gearwheel icon on the extension page and select **Add to Workspace Recommendations**.

</li>

</ol>

</Steps>

To install a specific version of the extension, we recommend storing the `genaiscript.vsix`
in your repository and using the manual installation steps.

### Default Profile for Terminal

GenAIScript launches a node server in the default terminal. If the default terminal is not configured
or does not support node.js, you may need to update it in your user/workspace settings.

-   Open command palette `Ctrl+Shift+P` and search for `Terminal: Select Default Profile`.
-   Select the terminal profile like **Git Bash**

### Manual Installation (Advanced)

The latest development build of the extension is also available on through the GitHub releases. This allows access
to bug fixes earlier than the marketplace release.

<Steps>

<ol>

<li>

Open the [latest release](https://github.com/microsoft/genaiscript/releases/latest/) on GitHub

</li><li>

Download the `genaiscript.vsix` into your project root folder

<FileTree>

-   ...
-   .genaiscript/ folder created by the extension to store supporting files
    -   cache/ various cache files
    -   retrieval/ retrieval database caches
    -   ... supporting files
-   **genaiscript.vsix**

</FileTree>

</li><li>

Open your project in Visual Studio Code

</li><li>

Right click on the `.vsix` file and select **Install Extension VSIX...**

</li>

</ol>

</Steps>

:::note[Cursor Support]

GenAIScript can be installed in [Cursor](https://cursor.sh/how-to-install-extension)
using the manual installation steps

:::

## Command Line

The [genaiscript](/genaiscript/reference/cli/) command line tool lets you run your GenAIScript
from any terminal.

```sh
npx genaiscript run my-script some/path/*.pdf
```

`npx` will automatically install and cache the CLI. You can also add it as a `devDependency` to your project.

```sh
npm install -D genaiscript
```

:::note

While most examples in the documentation assume you are using the Visual Studio Code extension,
the command line tool lets you use GenAiScript from any editor as well.

:::

:::note

Some optional packages used by the CLI do not support an installation behind an HTTP proxy, which is very common in an enterprise setting.

If your work environment requires going through a proxy, you should use `npm install --omit=optional` to have optional packages fail gracefully during the installation.

:::

:::note

If your work environment requires going through a proxy, you can set one of the following environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` or `https_proxy`) to have the CLI use a proxy, e.g. `HTTP_PROXY=http://proxy.acme.com:3128`.
:::


## Next steps

Let's configure the [LLM connection information](/genaiscript/getting-started/configuration)
