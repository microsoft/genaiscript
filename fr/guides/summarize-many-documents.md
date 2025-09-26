import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"

Supposons que j'ai un répertoire contenant plusieurs fichiers `.pdf` (ou autres) et que je veux exécuter un GenAIScript sur tous.
Dans cet exemple, je génère un tweet accrocheur pour chaque document et je veux enregistrer le tweet dans un autre fichier.

## Développement

<Steps>
  <ol>
    <li>
      Utilisez la commande `> GenAIScript : Créer un nouveau script...` dans la palette de commandes pour créer un nouveau script.
    </li>

    <li>
      C'est un script simple. En supposant que le script prenne le fichier en argument,
      vous pouvez référencer cet argument dans `env.files` et indiquer au LLM ce qu'il doit en faire :

      ```js title="gen-tweet.genai.mjs"
      script({ title: "gen-tweet" })

      def("FILE", env.files)

      $`Given the paper in FILE, write a 140 character summary of the paper 
      that makes the paper sound exciting and encourages readers to look at it.`
      ```
    </li>

    <li>
      Faites un clic droit sur le document dans l'explorateur VS Code (cela peut être un fichier `.pdf`, `.docx` ou `.md`
      car `def` sait lire et analyser tous ces formats).
      Sélectionnez **Exécuter GenAIScript**. Sélectionnez le script `gen-tweet` que vous venez d'écrire.
    </li>

    <li>
      Si l'on donne au GenAIScript un article décrivant GenAIScript, la sortie s'affichera dans un nouvel onglet de document.

      ```plaintext wrap
      Discover GenAIScript: a revolutionary scripting language integrating AI to automate complex tasks, making coding accessible to all! #AI #CodingFuture
      ```

      Comme nous n'avons pas demandé au LLM d'écrire la sortie dans un fichier, elle sera par défaut envoyée vers la sortie standard.
    </li>
  </ol>
</Steps>

## Automatisation

<Steps>
  <ol>
    <li>
      Nous pouvons exécuter le script depuis la [ligne de commande](../../reference/cli/) :

      ```sh wrap
      npx genaiscript run gen-tweet example1.pdf
      ```
    </li>

    <li>
      La sortie sera affichée dans le terminal.
    </li>

    <li>
      Maintenant que le script fonctionne pour un fichier unique, nous pouvons utiliser la ligne de commande pour l'appliquer à une liste
      de fichiers. Supposons que vous commenciez avec un fichier `ex1.pdf` et que vous souhaitiez la sortie dans un nouveau fichier `ex1.tweet.md`.
      La façon de procéder dépend du shell ou du script que vous préférez.

      <Tabs>
        <TabItem label="bash">
          ```bash wrap frame="none"
          for file in *.pdf; do
            newfile="${file%.pdf}.tweet.md"; # foo.pdf -> foo.tweet.md
            if [ ! -f "$newfile" ]; then # skip if already exists
              npx genaiscript run gen-tweet $file > $newfile
            fi
          done
          ```
        </TabItem>

        <TabItem label="PowerShell">
          ```powershell wrap frame="none"
          Get-ChildItem -Filter *.pdf | ForEach-Object {
            $newName = $_.BaseName + ".tweet.md"
            if (-not (Test-Path $newName)) {
              npx genaiscript run gen-tweet $_.FullName | Set-Content "$newName"
            }
          }
          ```
        </TabItem>

        <TabItem label="Python (on Windows)">
          ```python wrap frame="none"
          import subprocess, sys, os
          for input_file in sys.argv[1:]:
              output_file = os.path.splitext(input_file)[0] + '.tweet.md'
              if not os.path.exists(output_file):
                  with open(output_file, 'w') as outfile:
                      result = subprocess.check_output(
                        ["npx", "genaiscript", "run", "gen-tweet",
                        input_file], universal_newlines=True)
                      outfile.write(result)
          ```
        </TabItem>

        <TabItem label="JavaScript (node.js)">
          ```js wrap frame="none"
          #!/usr/bin/env zx
          import "zx/globals"

          const files = await glob("*.pdf")
          for (const file of files) {
              const out = file.replace(/\.pdf$/i, ".tweet.md") // foo.pdf -> foo.tweet.md
              if (!(await fs.exists(out)))
                  // don't regenerate if it already exists
                  await $`genaiscript run gen-tweet ${file} > ${out}`
          }
          ```

          Ce script nécessite [zx](https://github.com/google/zx).
        </TabItem>
      </Tabs>
    </li>
  </ol>
</Steps>