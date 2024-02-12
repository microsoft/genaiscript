import { createHTTPServer } from "@trpc/server/adapters/standalone"
import { z } from "zod"
import { publicProcedure, router } from "./trpc"
import { host } from "genaiscript-core"

export async function startServer(options: {
    port: string
    token: string
}): Promise<void> {
    const token = options.token
    const port = parseInt(options.port) || 3000

    const appRouter = router({
        retreivalClear: publicProcedure.query(async () => {
            const res = await host.retreival.clear()
            return res
        }),
        retreivalSearch: publicProcedure
            .input(z.string())
            .query(async (opts) => {
                const { input } = opts
                const res = await host.retreival.search(input)
                return res
            }),
        retreivalUpsert: publicProcedure
            .input(
                z.object({
                    filename: z.string(),
                    type: z.string(),
                    content: z.instanceof(Buffer),
                })
            )
            .mutation(async (opts) => {
                const { input } = opts
                const { filename, type, content } = input
                const res = await host.retreival.upsert(
                    filename,
                    new Blob([content], { type })
                )
                return res
            }),
    })
    const server = createHTTPServer({
        router: appRouter,
    })
    console.log(`starting server on port ${port}...`)
    server.listen(port)
}
