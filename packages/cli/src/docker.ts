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
            trace?.startDetails(`📦 container ${image}`)

            const docker = new Docker()
            const res = await docker.pull(image)
            docker.modem.followProgress(
                res,
                (err, output) => {
                    //console.log(output)
                    trace?.log(`pulled image`)
                    if (err) trace?.error(`failed to pull image`, err)
                },
                (ev) => {
                    //console.log(ev)
                }
            )
            await finished(res)

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
                const { cwd, label } = options || {}
                try {
                    trace?.startDetails(label || command)
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
