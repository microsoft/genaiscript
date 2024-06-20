import MemoryStream from "memorystream"
import {
    CORE_VERSION,
    DOCKER_CONTAINER_VOLUME,
    DOCKER_DEFAULT_IMAGE,
    DOCKER_VOLUMES_DIR,
    TraceOptions,
    dotGenaiscriptPath,
    errorMessage,
    host,
    installImport,
    logError,
    logVerbose,
} from "genaiscript-core"
import { finished } from "stream/promises"
import { ensureDir, remove } from "fs-extra"
import { randomBytes } from "node:crypto"
import { copyFile, readFile, writeFile } from "fs/promises"
import { DOCKERODE_VERSION } from "./version"

type DockerodeType = import("dockerode")

async function tryImportDockerode(options?: TraceOptions) {
    const { trace } = options || {}
    try {
        const m = await import("dockerode")
        return m
    } catch (e) {
        trace?.error(`dockerode not found, installing ${DOCKERODE_VERSION}...`)
        await installImport("dockerode", DOCKERODE_VERSION, trace)
        const m = await import("dockerode")
        return m
    }
}

export class DockerManager {
    private containers: ContainerHost[] = []
    private _docker: DockerodeType

    constructor() {}

    private async init(options?: TraceOptions) {
        if (this._docker) return
        const Docker = (await tryImportDockerode(options)).default
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
        try {
            trace?.startDetails(`📦 container start ${image}`)
            await this.pullImage(image, { trace })

            const hostPath = host.path.resolve(
                dotGenaiscriptPath(
                    DOCKER_VOLUMES_DIR,
                    image.replace(/:/g, "_"),
                    randomBytes(16).toString("hex")
                )
            )
            await ensureDir(hostPath)
            const containerPath = DOCKER_CONTAINER_VOLUME

            const container = await this._docker.createContainer({
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
                HostConfig: {
                    Binds: [`${hostPath}:${containerPath}`],
                },
            })
            trace?.itemValue(`id`, container.id)
            trace?.itemValue(`host path`, hostPath)
            trace?.itemValue(`container path`, containerPath)
            const inspection = await container.inspect()
            trace?.itemValue(`container state`, inspection.State?.Status)

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
                    trace?.item(`\`${command}\` ${args.join(" ")}`)

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
                    if (sres.stdout) trace?.detailsFenced(`stdout`, sres.stdout)
                    if (sres.stderr) trace?.detailsFenced(`stderr`, sres.stderr)

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
                await writeFile(hostFilename, content, { encoding: "utf8" })
            }

            const readText = async (filename: string, content: string) => {
                const hostFilename = host.path.resolve(hostPath, filename)
                return await readFile(hostFilename, { encoding: "utf8" })
            }

            const copy = async (from: string | string[], to: string) => {
                const files = await host.findFiles(from)
                for (const file of files) {
                    const source = host.path.resolve(file)
                    const target = host.path.resolve(hostPath, to, file)
                    await ensureDir(host.path.dirname(target))
                    await copyFile(source, target)
                }
            }

            const c = <ContainerHost>{
                id: container.id,
                disablePurge: !!options.disablePurge,
                hostPath,
                containerPath,
                exec,
                writeText,
                readText,
                copy,
            }
            this.containers.push(c)
            await container.start()

            return c
        } finally {
            trace?.endDetails()
        }
    }
}
