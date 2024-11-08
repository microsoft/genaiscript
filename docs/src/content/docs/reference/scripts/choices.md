---
title: Choices
description: Specify a list of preferred token choices for a script.
keywords: choices, preferred words, logit bias
---

You can specify a list of preferred words (choices) in the script metadata. It will increases the probability of the model generating the specified words.

-   Each word should match a single token for the desired model
-   For some models, GenAIScript does not have an encoder so it won't be able to compute the logit bias for the choices

```js
script({
    choices: ["OK", "ERR"],
})
```

## Logit Bias

Internally, GenAIScript tokenizes the word and build the [logit_bias](https://help.openai.com/en/articles/5247780-using-logit-bias-to-alter-token-probability-with-the-openai-api) for each token.

-   choices: `OK`, `ERR`
-   logit bias: `{"5175":5,"5392":5}`
