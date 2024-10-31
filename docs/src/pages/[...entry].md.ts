/**
 * Add a .md route that return the raw markdown content of the page.
 * This is useful for markdown pages; heavy mdx pages will need more work.
 */
import type { APIRoute } from "astro"
import type { InferGetStaticPropsType, GetStaticPaths } from "astro"
import { getCollection } from "astro:content"
export const getStaticPaths = (async () => {
    const entries = await getCollection("docs")
    return entries.map((entry) => ({
        params: { entry: entry.slug },
        props: { entry },
    }))
}) satisfies GetStaticPaths

type Props = InferGetStaticPropsType<typeof getStaticPaths>
export const GET: APIRoute<Props> = (context) => {
    return new Response(context.props.entry.body, {
        headers: {
            "content-type": "text/markdown",
        },
    })
}
