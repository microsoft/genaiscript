import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import packageJson from "../package.json"

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: packageJson.title,
            social: {
                github: packageJson.repository.url,
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
