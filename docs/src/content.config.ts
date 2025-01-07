import { defineCollection } from "astro:content"
import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { blogSchema } from "starlight-blog/schema"
import { videosSchema } from "starlight-videos/schemas"

export const collections = {
    docs: defineCollection({
        loader: docsLoader(),
        schema: docsSchema({
            extend: (context) => blogSchema(context).and(videosSchema),
        }),
    }),
}

export const GENPATH = import.meta.env.BASE_URL + "/"
