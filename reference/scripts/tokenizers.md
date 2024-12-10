
The `tokenizers` helper module provides a set of functions to split text into tokens.

```ts
const n = tokenizers.count("hello world")
```

## Choosing your tokenizer

By default, the `tokenizers` module uses the `large` tokenizer. You can change the tokenizer by passing the model identifier.

```ts 'model: "gpt-4o-mini"'
const n = await tokenizers.count("hello world", { model: "gpt-4o-mini" })
```

## `count`

Counts the number of tokens in a string.

```ts wrap
const n = await tokenizers.count("hello world")
```

## `truncate`

Drops a part of the string to fit into a token budget

```ts wrap
const truncated = await tokenizers.truncate("hello world", 5)
```

## `chunk`

Splits the text into chunks of a given token size. The chunk tries to find
appropriate chunking boundaries based on the document type.

```ts
const chunks = await tokenizers.chunk(env.files[0])
for(const chunk of chunks) {
    ...
}
```

You can configure the chunking size, overlap and add line numbers.

```ts wrap
const chunks = await tokenizers.chunk(env.files[0], {
    chunkSize: 128,
    chunkOverlap 10,
    lineNumbers: true
})
```
