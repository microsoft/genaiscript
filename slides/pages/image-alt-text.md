# Example: Image Alt Text

Poor alt text descriptions...

```html
<img src="..." alt="An image" /> 😦😦😦
```

GenAI to the rescue!

-   Tell the LLM to generate an alt text description

```js
const file = env.files[0]
defImages(file)
$`You are an expert in assistive technology. You will analyze each image
and generate a description alt text for the image.`
```

-   Generate files using the format defined in "system.files"

```js
$`Save the alt text in a file called "${file.filename + ".txt"}".`
```

-   cancel if the alt text file already exists

```js
const { content } = await workspace.readText(file.filename + ".txt")
if (content) cancel("Alt text file already exists")
```
