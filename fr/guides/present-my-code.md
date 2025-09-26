import { Code, Steps } from '@astrojs/starlight/components';
import importedCode from "../../../../../../samples/sample/genaisrc/slides.genai?raw";

<Steps>
  <ol>
    <li>
      Enregistrez le script ci-dessous dans votre projet sous le nom `genaisrc/slides.genai.js`.

      <Code code={importedCode} wrap={true} lang="js" title="slides.genai.mjs" />
    </li>

    <li>
      Cliquez avec le bouton droit sur le fichier ou dossier de code, sélectionnez **Run GenAIScript...** puis choisissez **Generate Slides**.
    </li>

    <li>
      Appliquez la refactorisation pour enregistrer le fichier de diapositives généré.
    </li>

    <li>
      Pour visualiser les diapositives, installez l'[extension vscode-reveal](https://marketplace.visualstudio.com/items?itemName=evilz.vscode-reveal).
      Ouvrez le fichier de diapositives et cliquez sur **slides** dans la barre d'état.
    </li>
  </ol>
</Steps>