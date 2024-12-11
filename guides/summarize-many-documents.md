import { Steps } from '@astrojs/starlight/components';
import { Tabs, TabItem } from '@astrojs/starlight/components';

Suppose I have a directory with multiple `.pdf` (or other) files and I want to run a GenAIScript over all of them.
In this example, I'm generating a catchy tweet for each document and I want to save the tweet in another file.

## Development

<Steps>
<ol>
<li>
Use the `> GenAIScript: Create new script...` command in the command palette to create a new script.
</li><li>
This is an easy script.  Assuming the script will take the file as an argument, 
you can refer to that argument in `env.files` and tell the LLM what to do with it:

```js title="gen-tweet.genai.mjs"
script({ title: "gen-tweet" })

def("FILE", env.files)

$`Given the paper in FILE, write a 140 character summary of the paper 
that makes the paper sound exciting and encourages readers to look at it.`      
```

</li><li>
Right click on the document in VS Code Explorer (it can be a `.pdf`, a `.docx`, or a `.md` file 
because `def` knows how to read and parse all these file types).
Select **Run GenAIScript**. Select the script `gen-tweet` you just wrote.
</li><li>
Assuming we give the GenAIScript a paper describing GenAIScript, the Output will be displayed in a new document tab.

```plaintext wrap
Discover GenAIScript: a revolutionary scripting language integrating AI to automate complex tasks, making coding accessible to all! #AI #CodingFuture
```

Because we didn't tell the LLM to write the output to a file, it will by default go to standard out. 
</li>
</ol>

</Steps>

## Automation

<Steps>
<ol>
<li>
We can run the script from the [command line](/genaiscript/reference/cli/):

```sh wrap
npx genaiscript run gen-tweet example1.pdf
```

</li><li>
The output will be displayed in the terminal.
</li><li>

Now that we have the script working for a single file, we can use the command line to apply it to a list of 
files.  Let's assume you start with a file `ex1.pdf` you want the output in a new file `ex1.tweet.md`.
How you do this depends on the shell script you prefer. (See [batch processing...](/genaiscript/reference/cli/batch)).

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
for(const file of files) {
  const out = file.replace(/\.pdf$/i, '.tweet.md') // foo.pdf -> foo.tweet.md
  if (!await fs.exists(out)) // don't regenerate if it already exists
    await $`npx --yes genaiscript run gen-tweet ${file} > ${out}`
}
```
This script requires [zx](https://github.com/google/zx).

</TabItem>

</Tabs>
</li>
</ol>
</Steps>
