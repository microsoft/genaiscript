---
title: Tokenizers
description: Tokenizers are used to split text into tokens.
sidebar:
  order: 60
hero:
  image:
    alt: An 8-bit style illustration of a geometric speech bubble made up of
      distinct, colored blocks to represent separate text tokens; some small
      colored rectangles detach from the main shape, symbolizing text chunking;
      a basic slider icon illustrates truncation. The image is minimalistic,
      flat, in five colors, sized 128x128 pixels, with no background or human
      figures.
    file: ./tokenizers.png
llmstxt:
  content: >-
    The `tokenizers` module splits text into tokens and provides functions for
    token counting, truncation, and chunking. By default, it uses the `large`
    tokenizer, but you can specify a model like `gpt-4o-mini`.


    `count`: Counts tokens in a string. Example: `const n = await
    tokenizers.count("hello world")`.


    `truncate`: Trims a string to fit within a token limit. Example: `const
    truncated = await tokenizers.truncate("hello world", 5)`.


    `chunk`: Splits text into token-sized chunks, with options for size,
    overlap, and line numbers. Example: 

    `const chunks = await tokenizers.chunk(env.files[0], { chunkSize: 128,
    chunkOverlap: 10, lineNumbers: true })`.
  hash: a61c73d5b426c5b9920dbfcd889ad053dc037c842eddb20cc753f9bb170479bd

---

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
