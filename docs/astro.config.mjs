import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"

// https://astro.build/config
export default defineConfig({
    site: "https://microsoft.github.io",
    base: "/genaiscript",
    integrations: [
        starlight({
            title: "GenAIScript",
            social: {
                github: "https://github.com/microsoft/genaiscript",
            },
            sidebar: [
                {
                    label: "Guides",
                    autogenerate: { directory: "reference" },
                },
                {
                    label: "Reference",
                    autogenerate: { directory: "reference" },
                },
            ],
        }),
    ],
})
