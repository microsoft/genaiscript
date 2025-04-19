import { Code } from "@astrojs/starlight/components"
import code from "../../../../genaisrc/blog-image.genai.mts?raw"

import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

We generate cover images to the blog, this in itself is completely uninteresting... but the script that generated the images
is worth a look.

The generation of an blog post cover is done in 3 phases:

- convert the blog markdown into an image prompt
- generate an image from the image prompt
- generate an alt text description from the image prompt
- resize, copy image and patch the blog post frontmatter

<Code code={code} lang="ts" wrap title="blog-image.genai.mts" />

Once this script worked for a couple posts,
use used the `convert` command to generate the images for all the blog posts.

```sh
genaiscript convert blog-image blog/*.md*
```

## What about the images?

The images are somewhat abstract, but they are generated from the blog post content.
The image prompt could definitely be improved, but it's a good start.