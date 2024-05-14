
# JavaScript execution

- In process eval

```js
script(...)
$`Write a poem.`
```

- Debugging Just Works™

- Support for `esm` through dynamic `import` (CLI only)

```js
script(...)
export default async function() {
    $`Write a poem.`
}
```