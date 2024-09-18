script({
    secrets: ["OPENAI_API_KEY"],
})

const repo = "codelion/optillm" // GitHub repository
// create docker image from GitHub repository (cached)
await host.exec("docker", [
    "build",
    "-t",
    repo,
    `https://github.com/${repo}.git`,
])
// launch container from the image
const container = await host.container({
    image: repo,
    ports: { containerPort: "8000/tcp", hostPort: 8000 },
    env: {
        OPENAI_API_KEY: env.secrets.OPENAI_API_KEY,
    },
    networkEnabled: true,
})
const res = await container.exec("python", ["--version"])
console.log(res.stderr)
