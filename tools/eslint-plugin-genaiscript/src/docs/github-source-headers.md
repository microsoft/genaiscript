# github-source-headers

Requires copyright headers in every source file.

Specifically, a source file is defined as any TypeScript file and the expected header text is as follows:

```fundamental
Copyright (c) Microsoft Corporation.
Licensed under the MIT license.
```

This rule is fixable using the `--fix` option.

## Examples

### Good

These must be located at the top of every source file.

```ts
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
```

```ts
/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT license.
 */
```

```ts
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// Other comment text here.
```

### Bad

```ts
// Copyright (c) Microsoft Corporation.
```

```ts
class Class {
  /* source code here */
}
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
```

## When to turn off

Only if rule breaks.
