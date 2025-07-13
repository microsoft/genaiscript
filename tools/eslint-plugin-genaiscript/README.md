# eslint-plugin-azure-sdk

An ESLint plugin enforcing [design guidelines for the JavaScript/TypeScript Azure SDK](https://azure.github.io/azure-sdk/typescript_introduction.html).

## Installing and Building

**Note**: This is an internal package that can only be used within the azure-sdk-for-js monorepo.

To enable `@genaiscript/eslint-plugin-genaiscript`, you'll need to add it to the list of `devDependencies` in your `package.json`:

```javascript
{
  ...,
  "devDependencies": {
    ...,
    "@genaiscript/eslint-plugin-genaiscript": "^1.0.0",
    ...
  },
  ...
}
```

The ESLint plugin must be built from source as part of your package's depdendencies. The fastest way to build a single package and its dependencies is to run the command `pnpm build --filter=<package name>...`. For example, to rebuild the Form Recognizer package and all of its dependencies, we run `pnpm build --filter=@genaiscript/ai-form-recognizer`. This will rebuild `eslint-plugin-genaiscript` if necessary and make it available for use by the package's NPM scripts.

**You must rebuild `eslint-plugin-genaiscript` after making changes to its own source files,** either using `rush build` as described above, or by entering the `tools/eslint-plugin-genaiscript` directory (this directory) and running `pnpm build`. Since the plugin is linked internally as part of our monorepo, the package does not need to be installed again after it is rebuilt.

## Configuration

ESLint will automatically use the configuration file `eslint.config.mjs` as explained in the [docs](https://eslint.org/docs/user-guide/configuring#using-configuration-files-2). Optionally, you can have a custom `eslint.config.mjs` file at the same location as your `package.json` file. A very simple one looks as follows: (note that the path to the base `eslint.config.mjs` file may be different)

```javascript
import genaiscriptESLint from "@genaiscript/eslint-plugin-genaiscript";

export default genaiscriptESLint.config();
```

If you need to modify or disable specific rules, you can do so in the `rules` section of your `.eslintrc` configuration file. For example, if you are not targeting Node, disable `ts-config-moduleresolution` as follows:

```javascript
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import genaiscriptESLint from "@genaiscript/eslint-plugin-genaiscript";

export default genaiscriptESLint.config([
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);


Some rules (see table below) are fixable using the `--fix` ESLint option (added in `1.3.0`).

## Supported Rules

### Key

| Symbol                    | Meaning                     |
| ------------------------- | --------------------------- |
| :triangular_flag_on_post: | Error                       |
| :warning:                 | Warning                     |
| :heavy_multiplication_x:  | Off                         |
| :heavy_check_mark:        | Fixable and autofix-enabled |
| :x:                       | Not fixable                 |

### Rules

| Rule                                                                                                                                                                              | Default                   | Fixable            | Release |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------ | ------- |
| [**github-source-headers**]https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/github-source-headers.md)                          | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-package-json-author**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-author.md)                       | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-package-json-bugs**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-bugs.md)                           | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-package-json-engine-is-present**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-engine-is-present.md) | :triangular_flag_on_post: | :heavy_check_mark: | `1.1.0` |
| [**ts-package-json-homepage**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-homepage.md)                   | :triangular_flag_on_post: | :x:                | `1.0.0` |                | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-package-json-license**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-license.md)                     | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-package-json-name**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-name.md)                           | :triangular_flag_on_post: | :x:                | `1.0.0` |
| [**ts-package-json-repo**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-package-json-repo.md)                           | :triangular_flag_on_post: | :heavy_check_mark: | `1.0.0` |
| [**ts-versioning-semver**](https://github.com/Microsoft/genaiscript/blob/dev/tools/eslint-plugin-genaiscript/docs/rules/ts-versioning-semver.md)                           | :triangular_flag_on_post: | :x:                | `1.0.0` |
