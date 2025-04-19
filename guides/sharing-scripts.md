import { FileTree } from "@astrojs/starlight/components"

GenAIScript scripts are files and can be shared like any other code file. 

As long as the script file are under the project folder, GenAIScript will look for `**/*.genai.js` files and `**/*.genai.mjs`.

Here are some ideas to share files.

## Git repository + submodules

If you store your scripts in a git repository, you can use git submodules to share them across multiple projects.

- repository containing your script (e.g. `https://.../shared-scripts`)
<FileTree>

- shared-scripts/ git repository `https://.../shared-scripts`
  - genaisrc/
    - my-script.genai.mjs
    - ...

</FileTree>

- referencing `shared-scritps` as a git submodule

```sh
git submodule add https://.../shared-scripts
git submodule update --init --recursive
```

<FileTree>

- my-project/
  - src/
  - ...
  - shared-scripts/ git submodule https://github.com/.../shared-scripts
    - genaisrc/
      - my-script.genai.mjs
    ...

</FileTree>

## GitHub Gists

[Gists](https://gist.github.com/) is a lightweight way to share a couple files.