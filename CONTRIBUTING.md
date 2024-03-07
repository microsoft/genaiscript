
# Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Developer setup

You can open this repo in a codespace to get the build environment needed.

-   Install Node.JS 20+
-   Run yarn

```sh
yarn install --frozen-lockfile
```

-   Press F5 to launch VS Code in debugging mode

## Dependencies

- run `yarn install` to refresh the lock file
- run `yarn gen:licenses` to refresh the 3rd party licenses

## Docs

Run `docs` to launch the documentation site.

```sh
yarn docs
```

## Release

Run the `release` script.

```sh
yarn release
```

## Documentation basics

Start local server

```sh
yarn docs
```