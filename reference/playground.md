import { Image } from "astro:assets"
import src from "../../../assets/playground.png"
import alt from "../../../assets/playground.png.txt?raw"

The **Playground** is a self-hosted web application that allows you to run GenAIScript scripts
from a friendly user interface. It sits between the GenAIScript CLI
and the GenAIScript Visual Studio Code integration.

> The playground is still under construction.

<Image src={src} alt={alt} />

## Launch

From your project workspace root, run

```sh
npx --yes genaiscript serve
```

then navigate to the URL printed on the console (typically `http://127.0.0.1:8003/`).

## Remote repository

You can run the playground on a remote repository using your current `.env` secrets.

```sh
npx --yes genaiscript serve --remote <repository>
```

## Local installation

`npx` can be slow to start, especially if you are running the playground frequently.
You can install the playground locally with

```sh
npm install -g genaiscript
```

then run

```sh
genaiscript serve
```

## Running scripts from a remote repository

You can use the `--remote` option to load scripts from a remote repository.
GenAIScript will do a shallow clone of the repository and run the script from the clone folder.

```sh
npx --yes genaiscript serve --remote https://github.com/...
```

There are additional flags to how the repository is cloned:

- `--remote-branch <branch>`: The branch to clone from the remote repository.
- `--remote-force`: Force the clone even if the cloned folder already exists.
- `--remote-nstall`: Install dependencies after cloning the repository.

:::caution

As usual, be careful when running scripts from a remote repository.
Make sure you trust the source before running the script and consider locking to a specific commit.

:::