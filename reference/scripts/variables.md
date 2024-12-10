
The `env.vars` object contains a set of variable values. You can use these variables to parameterize your script.

```javascript
// grab locale from variable or default to en-US
const locale = env.vars.locale || "en-US"
// conditionally modify prompt
if (env.vars.explain)
    $`Explain your reasoning`
```

### Script parameters

It is possible to declare parameters in the `script` function call. The `env.vars` object will contain the values of these parameters.

```js
script({
    parameters: {
        string: "the default value", // a string parameter with a default value
        number: 42, // a number parameter with a default value
        boolean: true, // a boolean parameter with a default value
        stringWithDescription: {
            // a string parameter with a description
            type: "string",
            default: "the default value",
            description: "A description of the parameter",
        },
    },
})
```

When invoking this script in VS Code, the user will be prompted to provide values for these parameters.

### Variables from the CLI

Use the `vars` field in the CLI to override variables. vars takes a sequence of `key=value` pairs.

```sh
npx genaiscript run ... --vars myvar=myvalue myvar2=myvalue2 ...
```

### Variables in tests

You can specify variables in the `tests` object of the `script` function. These variables will be available in the test scope.

```js "vars"
script({
    ...,
    tests: {
        ...,
        vars: {
            number: 42
        }
    }
})
```
