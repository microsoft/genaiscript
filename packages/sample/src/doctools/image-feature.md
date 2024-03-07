---
title: Images
sidebar:
    order: 10
---

Images can be added to the prompt for models that support this feature (like `gpt-4-turbo-v`).
Use the `defImages` function to declare the images. Supported images will vary
with models but typically include `PNG`, `JPEG`, `WEBP`, and `GIF`. Both local files and URLs are supported.

```js
defImages(env.files)
```

Read more about [OpenAI Vision](https://platform.openai.com/docs/guides/vision/limitations).
