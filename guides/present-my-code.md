import { Code, Steps } from '@astrojs/starlight/components';
import importedCode from "../../../../../packages/sample/genaisrc/slides.genai?raw"

<Steps>

<ol>

<li> 

Save the script below in your project as `genaisrc/slides.genai.js`.

<Code code={importedCode} wrap={true} lang="js" title="slides.genai.mjs" />

</li>

<li>

Right click on the code file or folder, select **Run GenAIScript...** and select **Generate Slides**.

</li>

<li>

Apply the refactoring to save the generated slides file.

</li>

<li>

To visualize the slides, install the [vscode-reveal extension](https://marketplace.visualstudio.com/items?itemName=evilz.vscode-reveal).
Open the slides file and click **slides** in the status bar.

</li>

</ol>

</Steps>