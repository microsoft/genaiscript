import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { blogSchema } from "starlight-blog/schema";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: (context) => {
        const blog = blogSchema(context);
        return blog.extend({
          llmstxt: z
            .object({
              /**
               * LLM-optimized version of the page content.
               * This field contains a condensed, LLM-friendly representation
               * of the page content optimized for consumption by language models.
               */
              content: z.string(),
              /**
               * Hash of the content used to determine if the LLM-optimized content needs refreshing.
               * This helps avoid regenerating the same content when the source hasn't changed.
               */
              hash: z.string(),
            })
            .optional(),
        });
      },
    }),
  }),
};

export const GENPATH = import.meta.env.BASE_URL + "/";
