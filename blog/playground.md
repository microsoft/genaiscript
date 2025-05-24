import { Image } from "astro:assets"
import src from "../../../assets/playground.png"
import alt from "../../../assets/playground.png.txt?raw"
import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

The newly 2025 release brings a number of new features and support for new models.

## Playground

The [Playground](/genaiscript/reference/playground) is a self-hosted web application that allows you to run GenAIScript scripts
from a friendly user interface. It sits between the GenAIScript CLI
and the GenAIScript Visual Studio Code integration.

<Image src={src} alt={alt} />

## o1

GenAIScript supports the various flavors of the [OpenAI o1](https://openai.com/o1/) models (mini, preview, ...). It also adds support for tools.

o1 is also available on [GitHub Models](https://github.com/marketplace/models/azure-openai/o1/playground)!

```js
script({ model: "github:openai/o1" })
$`Prove that the sum of the angles of a triangle is 180 degrees.`
```

## DeepSeek

GenAIScript supports [DeepSeek V3](https://www.deepseek.com/) through their OpenAI API.

```js
script({ model: "deepseek:deepseek-chat" })
$`Prove that the sum of the angles of a triangle is 180 degrees.`
```