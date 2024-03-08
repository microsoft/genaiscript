import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

// https://astro.build/config
export default defineConfig({
    site: "https://microsoft.github.io",
    base: "/genaiscript",
    integrations: [
        starlight({
            title: "GenAIScript",
            favicon: "/images/favicon.png",
            components: {
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
                    label: "Guides",
                    autogenerate: { directory: "guides" },
                },
                {
                    label: "Prompt Engineering",
                    autogenerate: { directory: "prompt-engineering" },
                },
                {
                    label: "Reference",
                    autogenerate: { directory: "reference" },
                },
                {
                    label: "FAQ",
                    link: "faq",
                },
            ],
        }),
    ],
})
