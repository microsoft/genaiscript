import { defineCollection } from "astro:content"
import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { blogSchema } from "starlight-blog/schema"
import { videosSchema } from "starlight-videos/schemas"

export const collections = {
    docs: defineCollection({
        loader: docsLoader(),
        schema: docsSchema({
            extend: (context) => {
                let schema = videosSchema
                const blog = blogSchema(context)
                if (blog) schema = schema.merge(blog)
                return schema
            },
        }),
    }),
}

export const GENPATH = import.meta.env.BASE_URL + "/"
