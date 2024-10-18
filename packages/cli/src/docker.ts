import MemoryStream from "memorystream"
import { finished } from "stream/promises"
import { ensureDir, remove } from "fs-extra"
import { copyFile, readFile, writeFile, readdir } from "fs/promises"
import {
    DOCKER_DEFAULT_IMAGE,
    DOCKER_VOLUMES_DIR,
    DOCKER_CONTAINER_VOLUME,
} from "../../core/src/constants"
import { randomHex } from "../../core/src/crypto"
import { errorMessage } from "../../core/src/error"
import { host } from "../../core/src/host"
import { MarkdownTrace, TraceOptions } from "../../core/src/trace"
import {
    logError,
    dotGenaiscriptPath,
    logVerbose,
    arrayify,
    sha1,
    sha1string,
} from "../../core/src/util"
import { CORE_VERSION } from "../../core/src/version"
import { isQuiet } from "./log"
import Dockerode, { Container } from "dockerode"
import { shellParse, shellQuote } from "../../core/src/shell"
import { PLimitPromiseQueue } from "../../core/src/concurrency"

type DockerodeType = import("dockerode")

export class DockerManager {
    private containers: ContainerHost[] = []
    private _docker: DockerodeType
    private _createQueue: PLimitPromiseQueue

    constructor() {
        this._createQueue = new PLimitPromiseQueue(1)
    }

    private async init(options?: TraceOptions) {
        if (this._docker) return
        const Docker = (await import("dockerode")).default
        this._docker = new Docker()
    }

    async stopAndRemove() {
        if (!this._docker) return
        for (const container of this.containers.filter((c) => !c.persistent)) {
            logVerbose(`container: removing ${container.name}`)
            const c = await this._docker.getContainer(container.id)
            if (!c) continue
            try {
                await c.stop()
            } catch (e) {
                logVerbose(e)
            }
            try {
                await c.remove()
            } catch (e) {
                logVerbose(e)
            }
            try {
                await remove(container.hostPath)
            } catch (e) {
                logVerbose(e)
            }
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

    private async tryGetContainer(filters: {
        id?: string[]
        name?: string[]
    }): Promise<Container> {
        try {
            const containers = await this._docker.listContainers({
                all: true,
                filters,
            })
            const info = containers?.[0]
            if (info) return this._docker.getContainer(info.Id)
        } catch {}
        return undefined
    }

    async startContainer(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        await this.init()
        const { persistent, trace } = options || {}
        if (persistent) {
            const { name, hostPath } = await this.containerName(options)
            const c = this.containers.find((c) => c.name === name)
            if (c) {
                logVerbose(`container: reusing ${name}`)
                await c.resume()
                return c
            }
            const container = await this.tryGetContainer({ name: [name] })
            if (container) {
                logVerbose(`container: reclaiming ${name}`)
                const c = await this.wrapContainer(
                    container,
                    options,
                    name,
                    hostPath
                )
                this.containers.push(c)
                await c.resume()
                const st = await container.inspect()
                if (st.State?.Status !== "running") {
                    logVerbose(`container: start failed`)
                    trace?.error(`container: start failed`)
                }
                logVerbose(`container: resuming ${name}`)
                return c
            }
        }
        return await this._createQueue.add(
            async () => await this.internalStartContainer(options)
        )
    }

    private async containerName(options: ContainerOptions): Promise<{
        name: string
        hostPath: string
    }> {
        const {
            image = DOCKER_DEFAULT_IMAGE,
            persistent,
            name: userName,
            ports,
            postCreateCommands,
            env,
            networkEnabled,
        } = options
        let name = (userName || image).replace(/[^a-zA-Z0-9]+/g, "_")
        if (persistent)
            name += `_${(await sha1string(JSON.stringify({ image, name, ports, env, networkEnabled, postCreateCommands }))).slice(0, 12)}`
        else name += `_${randomHex(6)}`
        const hostPath = host.path.resolve(
            dotGenaiscriptPath(DOCKER_VOLUMES_DIR, name)
        )
        return { name, hostPath }
    }

    private async internalStartContainer(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        const {
            image = DOCKER_DEFAULT_IMAGE,
            trace,
            env = {},
            networkEnabled,
            postCreateCommands,
        } = options
        const persistent =
            !!options.persistent || !!(options as any).disablePurge
        const ports = arrayify(options.ports)
        const { name, hostPath } = await this.containerName(options)
        try {
            trace?.startDetails(`📦 container start ${image}`)
            await this.pullImage(image, { trace })
            await ensureDir(hostPath)

            logVerbose(`container: create ${image} ${name || ""}`)
            const containerOptions: Dockerode.ContainerCreateOptions = {
                name,
                Image: image,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                OpenStdin: false,
                StdinOnce: false,
                NetworkDisabled: false, // disable after post create commands
                WorkingDir: "/" + DOCKER_CONTAINER_VOLUME,
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
                    Binds: [`${hostPath}:/${DOCKER_CONTAINER_VOLUME}`],
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
            trace?.itemValue(`container path`, DOCKER_CONTAINER_VOLUME)
            const inspection = await container.inspect()
            trace?.itemValue(`container state`, inspection.State?.Status)

            const c = await this.wrapContainer(
                container,
                options,
                name,
                hostPath
            )
            this.containers.push(c)
            await container.start()
            const st = await container.inspect()
            if (st.State?.Status !== "running") {
                logVerbose(`container: start failed`)
                trace?.error(`container: start failed`)
            }
            for (const command of arrayify(postCreateCommands)) {
                const [cmd, ...args] = shellParse(command)
                const res = await c.exec(cmd, args)
                if (res.failed)
                    throw new Error(
                        `${cmd} ${args.join(" ")} failed with exit code ${res.exitCode}`
                    )
            }
            if (!networkEnabled) await c.disconnect()
            return c
        } finally {
            trace?.endDetails()
        }
    }

    private async wrapContainer(
        container: Dockerode.Container,
        options: Omit<ContainerOptions, "name" | "hostPath"> & TraceOptions,
        name: string,
        hostPath: string
    ): Promise<ContainerHost> {
        const { trace, persistent } = options

        const stop: () => Promise<void> = async () => {
            await this.stopContainer(container.id)
        }

        const resolveContainerPath = (to: string) => {
            const res = /^\//.test(to)
                ? host.path.resolve(
                      hostPath,
                      DOCKER_CONTAINER_VOLUME,
                      to.replace(/^\//, "")
                  )
                : host.path.resolve(hostPath, DOCKER_CONTAINER_VOLUME, to || "")
            return res
        }

        const resume: () => Promise<void> = async () => {
            const state = await container.inspect()
            if (state.State.Paused) await container.unpause()
        }

        const pause: () => Promise<void> = async () => {
            const state = await container.inspect()
            if (state.State.Running) await container.pause()
        }

        const exec = async (
            command: string,
            args?: string[] | ShellOptions,
            options?: ShellOptions
        ): Promise<ShellOutput> => {
            // Parse the command and arguments if necessary
            if (!Array.isArray(args) && typeof args === "object") {
                // exec("cmd arg arg", {...})
                if (options !== undefined)
                    throw new Error("Options must be the second argument")
                options = args as ShellOptions
                const parsed = shellParse(command)
                command = parsed[0]
                args = parsed.slice(1)
            } else if (args === undefined) {
                // exec("cmd arg arg")
                const parsed = shellParse(command)
                command = parsed[0]
                args = parsed.slice(1)
            }

            const { cwd: userCwd, label } = options || {}
            const cwd = userCwd
                ? resolveContainerPath(userCwd)
                : "/" + DOCKER_CONTAINER_VOLUME
            try {
                trace?.startDetails(`📦 ▶️ container exec ${label || command}`)
                trace?.itemValue(`container`, container.id)
                trace?.itemValue(`cwd`, cwd)
                trace?.fence(`${command} ${shellQuote(args || [])}`, "sh")
                if (!isQuiet)
                    logVerbose(
                        `container exec: ${shellQuote([command, ...args])}`
                    )

                let inspection = await container.inspect()
                trace?.itemValue(`container state`, inspection.State?.Status)
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
                trace?.resultItem(exitCode === 0, `exit code: ${sres.exitCode}`)
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
            const hostFilename = host.path.resolve(
                hostPath,
                resolveContainerPath(filename)
            )
            await ensureDir(host.path.dirname(hostFilename))
            await writeFile(hostFilename, content ?? "", {
                encoding: "utf8",
            })
        }

        const readText = async (filename: string) => {
            const hostFilename = host.path.resolve(
                hostPath,
                resolveContainerPath(filename)
            )
            try {
                return await readFile(hostFilename, { encoding: "utf8" })
            } catch (e) {
                return undefined
            }
        }

        const copyTo = async (
            from: string | string[],
            to: string
        ): Promise<string[]> => {
            const cto = resolveContainerPath(to)
            const files = await host.findFiles(from)
            const res: string[] = []
            for (const file of files) {
                const source = host.path.resolve(file)
                const target = host.path.resolve(cto, host.path.basename(file))
                await ensureDir(host.path.dirname(target))
                await copyFile(source, target)
                res.push(host.path.join(to, host.path.basename(file)))
            }
            return res
        }

        const listFiles = async (to: string) => {
            const source = host.path.resolve(hostPath, resolveContainerPath(to))
            try {
                const files = await readdir(source)
                return files
            } catch (e) {
                return []
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

        const c = Object.freeze<ContainerHost>({
            id: container.id,
            name,
            persistent,
            hostPath,
            containerPath: DOCKER_CONTAINER_VOLUME,
            stop,
            exec,
            writeText,
            readText,
            copyTo,
            listFiles,
            disconnect,
            pause,
            resume,
            scheduler: new PLimitPromiseQueue(1),
        })
        return c
    }
}
