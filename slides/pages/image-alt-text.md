# Example: Image Alt Text

Poor alt text descriptions...

```html
<img src="..." alt="An image" /> 😦😦😦
```

GenAI to the rescue!

-   Add image in context

```js
defImages(env.files, { autoCrop: true })
```

-   Tell the LLM to generate an alt text description

```js
$`You are an expert in assistive technology. You will analyze each image
and generate a description alt text for the image.`
```

-   Generate files using the format defined in "system.files"

```js
$`Save the alt text in a file called "<filename>.txt".`
```
