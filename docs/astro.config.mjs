import { defineConfig, passthroughImageService } from "astro/config"
import starlight from "@astrojs/starlight"
import starlightBlog from "starlight-blog"
import rehypeMermaid from "rehype-mermaid"
import starlightLinksValidator from "starlight-links-validator"
import starlightLlmsTxt from "starlight-llms-txt"

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
                starlightLlmsTxt({
                    description: `GenAIScript is a JavaScript library and environment to build productive script using LLMs.
- GenAIScript programs are meant to be executed through the genaiscript cli (https://www.npmjs.com/package/genaiscript).
- When generating code for GenAIScript, always target TypeScript, Node.JS, ESM. Prefer await/async, keep it simple.
- All pages of the documentation have a markdown route by adding '.md' to the URL.
                    `,
                    pageSeparator: "\n\n======\n\n",
                    customSets: [
                        {
                            label: "Getting Started",
                            description:
                                "Sequence of short tutorials on how to get started with GenAIScript",
                            paths: ["getting-started/**"],
                        },
                        {
                            label: "Reference",
                            description:
                                "full reference documentation for my project",
                            paths: ["reference/**"],
                        },
                        {
                            label: "Guides",
                            description:
                                "Guides on various LLM programming topics",
                            paths: ["guides/**", "case-studies/**"],
                        },
                        {
                            label: "Samples",
                            description:
                                "Advanced samples used for specific common scenarios",
                            paths: ["samples/**"],
                        },
                    ],
                }),
                starlightLinksValidator(),
            ],
            components: {
                Head: "./src/components/Head.astro",
                Footer: "./src/components/Footer.astro",
            },
            social: {
                github: "https://github.com/microsoft/genaiscript",
                youtube: "https://www.youtube.com/@pelihalleux",
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
