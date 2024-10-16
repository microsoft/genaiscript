import { ParquetReader } from "@dsnp/parquetjs"

type SweBenchBenchmark = {
    repo: string
    instance_id: string
    base_commit: string
    patch: string
    test_patch: string
    problem_statement: string
    hints_text: string
    created_at: string
    version: string
    FAILTO_PASS: string
    PASS_TO_PASS: string
    environment_setup_commit: string
}

const benchmarks = loadBenchmarks("src/swe-bench/query_result.parquet")

async function* loadBenchmarks(filePath: string) {
    const dataset = await ParquetReader.openFile(filePath)
    const cursor = dataset.getCursor()
    let record: SweBenchBenchmark
    while ((record = (await cursor.next()) as any)) {
        console.log(record)
        yield record
    }
}

async function startContainer(benchmark: SweBenchBenchmark) {
    const { repo, instance_id, base_commit, patch } = benchmark
    const container = host.container({
        image: "node:20",
        postCreateCommands: [
            `git clone https://github.com/${repo} .`,
            `git config --global --add safe.directory /app`,
            `git checkout ${base_commit}`,
            `npm install -g genaiscript`
        ],
    })
    return container
}

async function mountTools(
    container: ContainerHost,
    ctx: ChatGenerationContext
) {
    ctx.defTool(
        "fs_read_file",
        "Reads a file from the file system",
        {
            filename: {
                type: "string",
                description: "The path to the file to read",
            },
        },
        async (args) => {
            const { context, filename } = args
            context.log(`cat ${filename}`)
            return container.readText(filename)
        }
    )
}

async function solveBenchmark(benchmark: SweBenchBenchmark) {
    const { repo, instance_id, base_commit, patch, problem_statement } = benchmark
    console.log(`${instance_id}: ${repo}#${base_commit}`)

    const container = await startContainer(benchmark)
    const res = await runPrompt(
        async (ctx) => {
            await mountTools(container, ctx)
        },
        {
            model: "large",
        }
    )
}

for await (const benchmark of benchmarks) {
    await solveBenchmark(benchmark)
    break
}
