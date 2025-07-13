---
layout: image-left
image: /image-alt-text.jpg

---
# Image Alt Text

<v-click>

Poor alt text descriptions...

```html
<img src="..." alt="An image" /> 😦😦😦
```
</v-click>

<v-click>

-   Add image in context

```js
defImages(env.files, { autoCrop: true })
```

</v-click>

<v-click>

-   Tell the LLM to generate an alt text description

```js
$`You are an expert in assistive technology.
You will analyze each image
and generate a description for the image.`
```

</v-click>

<v-click>

- RAG with `good old` grep

```js
const { files } = await workspace.grep(
    /!\[\s*\]\(([^\)]+)\)/g, {
    glob: "**/*.md*",
})
```

</v-click>