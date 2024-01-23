import { $, glob, path } from 'zx'
import { test, describe, expect } from "vitest"
import "dotenv/config"

const gptoolsjs = `../../packages/cli/built/gptools.js`
const tools = ['lza_review']

tools.forEach(tool => describe(tool, async () => {
    const dir = path.resolve(`./aca-landing-zone-accelerator/scenarios/aca-internal/bicep/modules/`)
    const files = await glob(path.join(dir, "**/deploy.*.bicep"))
    files.forEach(file => {
        const name = file.substring(dir.length + 1)
        return test(name.replace(/\.bicep$/, ''), async () => {
            const { review, stderr } = await $`node ${gptoolsjs} run ${tool} ${file} --no-colors --out ./test-results/${tool}/${name}      `
            console.log(stderr)
            expect(review).toBe(undefined)
        }, { timeout: 120000 })
    })
}))
