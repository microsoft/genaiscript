const repo = "codelion/optillm"
await host.exec("docker", [
    "build",
    "-t",
    repo,
    `https://github.com/${repo}.git`,
])
const container = await host.container({
    image: repo,
    ports: { containerPort: "8000/tcp", hostPort: 8000 },
    env: {
        "OPENAI_API_KEY": "123456",
    },
    networkEnabled: true,
})
const res = await container.exec("python", ["--version"])
console.log(res.stderr)