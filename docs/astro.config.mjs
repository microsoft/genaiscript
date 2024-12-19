import { defineConfig, passthroughImageService } from "astro/config"
import starlight from "@astrojs/starlight"
import starlightBlog from "starlight-blog"
import rehypeMermaid from "rehype-mermaid"
import starlightLinksValidator from "starlight-links-validator"

// https://astro.build/config
export default defineConfig({
    site: "https://microsoft.github.io",
    base: "/genaiscript",
    image: {
        service: passthroughImageService(),
    },
    markdown: {
        rehypePlugins: [[rehypeMermaid, { strategy: "img-svg", dark: true }]],
    },
    integrations: [
        starlight({
            title: "GenAIScript",
            favicon: "/images/favicon.png",
            logo: {
                src: "./src/assets/logo.svg",
            },
            customCss: ["./src/styles/custom.css"],
            plugins: [
                starlightBlog({
                    authors: {
                        genaiscript: {
                            name: "GenAIScript",
                            title: "GenAI Blogger",
                            picture: "/images/favicon.png",
                            url: "https://github.com/microsoft/genaiscript/blob/main/genaisrc/blog-generator.genai.mts",
                        },
                        pelikhan: {
                            name: "Peli",
                            title: "GenAIScript developer",
                            picture:
                                "https://avatars.githubusercontent.com/u/4175913?s=400&u=2aca7b068fa646da550c534145764d50f533561d&v=4",
                            url: "https://github.com/pelikhan",
                        },
                    },
                }),
                starlightLinksValidator(),
            ],
            components: {
                Head: "./src/components/Head.astro",
                Footer: "./src/components/Footer.astro",
            },
            social: {
                github: "https://github.com/microsoft/genaiscript",
            },
            editLink: {
                baseUrl:
                    "https://github.com/microsoft/genaiscript/edit/main/docs/",
            },
            sidebar: [
                {
                    label: "Start Here",
                    autogenerate: { directory: "getting-started" },
                },
                {
                    label: "Case Studies",
                    autogenerate: { directory: "case-studies" },
                },
                {
                    label: "Samples",
                    autogenerate: { directory: "samples" },
                },
                {
                    label: "Guides",
                    autogenerate: { directory: "guides" },
                },
                {
                    label: "Reference",
                    autogenerate: { directory: "reference" },
                },
                {
                    label: "Blog",
                    link: "blog",
                },
                {
                    label: "FAQ",
                    link: "faq",
                },
                {
                    label: "Slides",
                    link: "slides",
                },
                {
                    label: "Contributing",
                    link: "https://github.com/microsoft/genaiscript/blob/main/CONTRIBUTING.md",
                },
            ],
        }),
    ],
})
