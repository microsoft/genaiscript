import Docker from "dockerode"
import MemoryStream from "memorystream"
import {
    DOCKER_DEFAULT_IMAGE,
    TraceOptions,
    logError,
    logVerbose,
} from "genaiscript-core"
import { finished } from "stream/promises"

export class DockerManager {
    private containers: Docker.Container[] = []
    private docker = new Docker()
    private pulledImages: string[] = []

    async stopAndRemove() {
        for (const container of this.containers) {
            try {
                await container.stop()
                await container.remove()
            } catch (e) {
                logError(e)
            }
        }
        this.containers = []
    }

    async pullImage(image: string, options?: TraceOptions) {
        const { trace } = options || {}

        if (this.pulledImages.includes(image)) return

        try {
            trace?.startDetails(`📥 pull image ${image}`)
            const res = await this.docker.pull(image)
            this.docker.modem.followProgress(
                res,
                (err, output) => {
                    if (err) trace?.error(`failed to pull image ${image}`, err)
                    else {
                        this.pulledImages.push(image)
                    }
                },
                (ev) => {
                    trace?.item(ev.progress || ev.status)
                }
            )
            await finished(res)
        } catch (e) {
            trace?.error(`failed to pull image ${image}`, e)
            throw e
        } finally {
            trace?.endDetails()
        }
    }

    async startContainer(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        const {
            image = DOCKER_DEFAULT_IMAGE,
            trace,
            env = {},
            networkEnabled,
            name,
        } = options
        try {
            trace?.startDetails(`📦 container start ${image}`)
            await this.pullImage(image, { trace })
            const container = await this.docker.createContainer({
                name,
                Image: image,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                OpenStdin: false,
                StdinOnce: false,
                NetworkDisabled: !networkEnabled,
                Env: Object.entries(env).map(([key, value]) =>
                    value === undefined || value === null
                        ? key
                        : `${key}=${value}`
                ),
            })
            this.containers.push(container)
            trace?.itemValue(`id`, container.id)
            await container.start()

            const exec: ShellHost["exec"] = async (command, args, options) => {
                const { cwd, label } = options || {}
                try {
                    trace?.startDetails(
                        `📦 ▶️ container exec ${label || command}`
                    )
                    trace?.itemValue(`container`, container.id)
                    trace?.itemValue(`cwd`, cwd)
                    trace?.item(`\`${command}\` ${args.join(" ")}`)

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
                    await finished(stream)
                    stdout.end()
                    stderr.end()
                    const inspect = await exec.inspect()
                    const exitCode = inspect.ExitCode

                    const sres = {
                        exitCode,
                        stdout: stdout.toString(),
                        stderr: stderr.toString(),
                    }
                    trace?.resultItem(
                        exitCode === 0,
                        `exit code: ${sres.exitCode}`
                    )
                    if (sres.stdout) trace?.detailsFenced(`output`, sres.stdout)
                    if (sres.stderr) trace?.detailsFenced(`error`, sres.stderr)

                    return sres
                } finally {
                    trace?.endDetails()
                }
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
