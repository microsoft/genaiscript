import Docker from "dockerode"
import MemoryStream from "memorystream"
import {
    DOCKER_DEFAULT_IMAGE,
    TraceOptions,
    logError,
    logVerbose,
} from "genaiscript-core"

export class DockerManager {
    private containers: Docker.Container[] = []

    async stop() {
        for (const container of this.containers) {
            try {
                logVerbose(`stopping container ${container.id}`)
                await container.stop()
                await container.remove()
            } catch (e) {
                logError(e)
            }
        }
        this.containers = []
    }

    async startContainer(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        const { image = DOCKER_DEFAULT_IMAGE, trace } = options
        try {
            trace?.startDetails(`📦 start container ${image}`)

            const docker = new Docker()
            const container = await docker.createContainer({
                Image: image,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                OpenStdin: false,
                StdinOnce: false,
            })
            await container.start()

            const exec: ShellHost["exec"] = async (command, args, options) => {
                const { cwd } = options || {}
                const exec = await container.exec({
                    Cmd: [command, ...args],
                    WorkingDir: cwd,
                    Privileged: false,
                    AttachStdin: false,
                    AttachStderr: true,
                    AttachStdout: true,
                })
                const stream = await exec.start({})
                const stdout = MemoryStream.createWriteStream()
                const stderr = MemoryStream.createWriteStream()
                container.modem.demuxStream(stream, stdout, stderr)
                return new Promise<Partial<ShellOutput>>((resolve, reject) => {
                    stream.on("end", async () => {
                        stdout.end()
                        stderr.end()
                        const inspect = await exec.inspect()
                        const exitCode = inspect.ExitCode
                        resolve({
                            exitCode,
                            stdout: stdout.toString(),
                            stderr: stdout.toString(),
                        })
                    })
                    stream.on("error", reject)
                })
            }

            return <ContainerHost>{
                id: container.id,
                exec,
            }
        } finally {
            trace?.endDetails()
        }
    }
}
