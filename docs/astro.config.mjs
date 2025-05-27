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
                    description: `GenAIScript is a JavaScript/TypeScript library and environment to build productive script using LLMs.`,
                    details: `## Markdown Documentation
All pages of the documentation have a markdown route by adding '.md' to the URL.
For example, the markdown for https://microsoft.github.io/genaiscript/reference/scripts 
is at https://microsoft.github.io/genaiscript/reference/scripts.md

## Guidance for Code Generation
- GenAIScript programs are meant to be executed through the genaiscript cli (https://www.npmjs.com/package/genaiscript).
- When generating code for GenAIScript, always target TypeScript, Node.JS, ESM. Prefer await/async, keep it simple.
- ambient types and definitions defined in "genaiscript.d.ts" are preloaded at runtime. you do not need to import them.
- you keep the code simple, avoid exception handlers or error checking.
- you add TODOs where you are unsure so that the user can review them
- you use the global types in genaiscript.d.ts are already loaded in the global context, no need to import them.
- save generated code in the "./genaisrc" folder with ".genai.mts" extension
`,
                    minify: {
                        customSelectors: ["picture"],
                    },
                    promote: ["index*", "getting-started*", "!*/*"],
                    exclude: ["glossary", "slides"],
                    customSets: [
                        {
                            label: "Getting Started",
                            description:
                                "Sequence of short tutorials on how to get started with GenAIScript",
                            paths: ["getting-started/**"],
                        },
                        {
                            label: "Configuration",
                            description: "Configure access to LLMs and other services",
                            paths: ["configuration/**"],
                        },
                        {
                            label: "Reference",
                            description:
                                "full reference documentation (runtime and cli)",
                            paths: ["reference/**"],
                        },
                        {
                            label: "Reference Scripts",
                            description:
                                "full reference documentation for the runtime",
                            paths: ["reference/scripts/**"],
                        },
                        {
                            label: "Reference CLI",
                            description:
                                "full reference documentation for the command line interface and Node.JS runtime",
                            paths: ["reference/cli/**", "reference/api/**"],
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
            social: [
                {
                    icon: "discord",
                    label: "Discord",
                    href: "https://discord.gg/y7HpumjHeB",
                },
                {
                    icon: "github",
                    label: "GitHub",
                    href: "https://github.com/microsoft/genaiscript",
                },
                {
                    icon: "youtube",
                    label: "YouTube",
                    href: "https://www.youtube.com/@pelihalleux",
                },
            ],
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
                    label: "Configuration",
                    autogenerate: { directory: "configuration" },
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
                    link: "dev",
                },
            ],
        }),
    ],
})
