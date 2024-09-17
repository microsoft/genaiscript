import MemoryStream from "memorystream"
import { finished } from "stream/promises"
import { ensureDir, remove } from "fs-extra"
import { copyFile, readFile, writeFile } from "fs/promises"
import {
    DOCKER_DEFAULT_IMAGE,
    DOCKER_VOLUMES_DIR,
    DOCKER_CONTAINER_VOLUME,
} from "../../core/src/constants"
import { randomHex } from "../../core/src/crypto"
import { errorMessage } from "../../core/src/error"
import { host } from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import {
    logError,
    dotGenaiscriptPath,
    logVerbose,
    arrayify,
} from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import { isQuiet } from "./log"
import Dockerode from "dockerode"

type DockerodeType = import("dockerode")

export class DockerManager {
    private containers: ContainerHost[] = []
    private _docker: DockerodeType

    constructor() {}

    private async init(options?: TraceOptions) {
        if (this._docker) return
        const Docker = (await import("dockerode")).default
        this._docker = new Docker()
    }

    async stopAndRemove() {
        if (!this._docker) return
        for (const container of this.containers.filter(
            (c) => !c.disablePurge
        )) {
            const c = await this._docker.getContainer(container.id)
            try {
                await c.stop()
            } catch {}
            try {
                await c.remove()
            } catch (e) {
                logError(e)
            }
            await remove(container.hostPath)
        }
        this.containers = []
    }

    async stopContainer(id: string) {
        const c = await this._docker?.getContainer(id)
        if (c) {
            try {
                await c.stop()
            } catch {}
            try {
                await c.remove()
            } catch (e) {
                logError(e)
            }
        }
        const i = this.containers.findIndex((c) => c.id === id)
        if (i > -1) {
            const container = this.containers[i]
            try {
                await remove(container.hostPath)
            } catch (e) {
                logError(e)
            }
            this.containers.splice(i, 1)
        }
    }

    async checkImage(image: string) {
        await this.init()
        try {
            const info = await this._docker.getImage(image).inspect()
            return info?.Size > 0
        } catch (e) {
            // statusCode: 404
            return false
        }
    }

    async pullImage(image: string, options?: TraceOptions) {
        await this.init()
        const { trace } = options || {}

        if (await this.checkImage(image)) return

        // pull image
        try {
            trace?.startDetails(`📥 pull image ${image}`)
            const res = await this._docker.pull(image)
            this._docker.modem.followProgress(
                res,
                (err) => {
                    if (err) trace?.error(`failed to pull image ${image}`, err)
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

    async container(id: string): Promise<ContainerHost> {
        const c = this.containers.find((c) => c.id === id)
        return c
    }

    async startContainer(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        await this.init()
        const {
            image = DOCKER_DEFAULT_IMAGE,
            trace,
            env = {},
            networkEnabled,
            name,
        } = options
        const ports = arrayify(options.ports)
        try {
            trace?.startDetails(`📦 container start ${image}`)
            await this.pullImage(image, { trace })

            const hostPath = host.path.resolve(
                dotGenaiscriptPath(
                    DOCKER_VOLUMES_DIR,
                    image.replace(/:/g, "_"),
                    randomHex(16)
                )
            )
            await ensureDir(hostPath)

            const containerPath = DOCKER_CONTAINER_VOLUME
            logVerbose(`container: create ${image} ${name ?? ""}`)
            const containerOptions: Dockerode.ContainerCreateOptions = {
                name,
                Image: image,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                OpenStdin: false,
                StdinOnce: false,
                NetworkDisabled: !networkEnabled,
                WorkingDir: containerPath,
                Labels: {
                    genaiscript: "true",
                    "genaiscript.version": CORE_VERSION,
                    "genaiscript.hostpath": hostPath,
                },
                Env: Object.entries(env).map(([key, value]) =>
                    value === undefined || value === null
                        ? key
                        : `${key}=${value}`
                ),
                ExposedPorts: ports.reduce(
                    (acc, { containerPort }) => {
                        acc[containerPort] = {}
                        return acc
                    },
                    <Record<string, any>>{}
                ),
                HostConfig: {
                    Binds: [`${hostPath}:${containerPath}`],
                    PortBindings: ports?.reduce(
                        (acc, { containerPort, hostPort }) => {
                            acc[containerPort] = [
                                { HostPort: String(hostPort) },
                            ]
                            return acc
                        },
                        <Record<string, { HostPort: string }[]>>{}
                    ),
                },
            }
            const container =
                await this._docker.createContainer(containerOptions)
            trace?.itemValue(`id`, container.id)
            trace?.itemValue(`host path`, hostPath)
            trace?.itemValue(`container path`, containerPath)
            const inspection = await container.inspect()
            trace?.itemValue(`container state`, inspection.State?.Status)

            const stop: () => Promise<void> = async () => {
                await this.stopContainer(container.id)
            }

            const exec: ShellHost["exec"] = async (
                command,
                args,
                options
            ): Promise<ShellOutput> => {
                const { cwd: userCwd, label } = options || {}
                const cwd = userCwd
                    ? host.path.join(containerPath, userCwd)
                    : containerPath
                try {
                    trace?.startDetails(
                        `📦 ▶️ container exec ${label || command}`
                    )
                    trace?.itemValue(`container`, container.id)
                    trace?.itemValue(`cwd`, cwd)
                    trace?.fence(`${command} ${args.join(" ")}`, "sh")
                    if (!isQuiet)
                        logVerbose(
                            `container exec: ${command} ${args.join(" ")}`
                        )

                    let inspection = await container.inspect()
                    trace?.itemValue(
                        `container state`,
                        inspection.State?.Status
                    )
                    if (inspection.State?.Paused) {
                        trace?.log(`unpausing container`)
                        await container.unpause()
                    } else if (!inspection.State?.Running) {
                        trace?.log(`restarting container`)
                        await container.restart()
                    }

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

                    const sres: ShellOutput = {
                        exitCode,
                        stdout: stdout.toString(),
                        stderr: stderr.toString(),
                        failed: exitCode !== 0,
                    }
                    trace?.resultItem(
                        exitCode === 0,
                        `exit code: ${sres.exitCode}`
                    )
                    if (sres.stdout) {
                        trace?.detailsFenced(`stdout`, sres.stdout, "txt")
                        if (!isQuiet) logVerbose(sres.stdout)
                    }
                    if (sres.stderr) {
                        trace?.detailsFenced(`stderr`, sres.stderr, "txt")
                        if (!isQuiet) logVerbose(sres.stderr)
                    }

                    return sres
                } catch (e) {
                    trace?.error(`${command} failed`, e)
                    return {
                        exitCode: -1,
                        failed: true,
                        stderr: errorMessage(e),
                    }
                } finally {
                    trace?.endDetails()
                }
            }

            const writeText = async (filename: string, content: string) => {
                const hostFilename = host.path.resolve(hostPath, filename)
                await ensureDir(host.path.dirname(hostFilename))
                await writeFile(hostFilename, content ?? "", {
                    encoding: "utf8",
                })
            }

            const readText = async (filename: string, content: string) => {
                const hostFilename = host.path.resolve(hostPath, filename)
                return await readFile(hostFilename, { encoding: "utf8" })
            }

            const copyTo = async (from: string | string[], to: string) => {
                const files = await host.findFiles(from)
                for (const file of files) {
                    const source = host.path.resolve(file)
                    const target = host.path.resolve(hostPath, to, file)
                    await ensureDir(host.path.dirname(target))
                    await copyFile(source, target)
                }
            }

            const disconnect = async () => {
                const networks = await this._docker.listNetworks()
                for (const network of networks.filter(
                    ({ Name }) => Name === "bridge"
                )) {
                    const n = await this._docker.getNetwork(network.Id)
                    if (n) {
                        const state = await n.inspect()
                        if (state?.Containers?.[container.id]) {
                            logVerbose(`container: disconnect ${network.Name}`)
                            await n.disconnect({ Container: container.id })
                        }
                    }
                }
            }

            const c = <ContainerHost>{
                id: container.id,
                disablePurge: !!options.disablePurge,
                hostPath,
                containerPath,
                stop,
                exec,
                writeText,
                readText,
                copyTo,
                disconnect,
            }
            this.containers.push(c)
            await container.start()

            return c
        } finally {
            trace?.endDetails()
        }
    }
}
