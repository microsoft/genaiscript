"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerManager = void 0;
const memorystream_1 = __importDefault(require("memorystream"));
const promises_1 = require("node:stream/promises");
const promises_2 = require("fs/promises");
const es_toolkit_1 = require("es-toolkit");
const core_1 = require("@genaiscript/core");
const node_path_1 = require("node:path");
const dbg = (0, core_1.genaiscriptDebug)("docker");
function dbgContainer(c) {
    const name = c?.name;
    return name ? dbg.extend(name) : dbg;
}
class DockerManager {
    containers = [];
    _docker;
    _createQueue;
    constructor() {
        this._createQueue = new core_1.PLimitPromiseQueue(1);
    }
    async init() {
        if (this._docker) {
            return;
        }
        const Docker = (await import("dockerode")).default;
        dbg(`dockerode module imported`);
        this._docker = new Docker();
    }
    async stopAndRemove() {
        if (!this._docker) {
            return;
        }
        dbg(`stopping %d containers`, this.containers?.length);
        for (const container of this.containers.filter((c) => !c.persistent)) {
            (0, core_1.logVerbose)(`container: removing ${container.id}`);
            const dbgc = dbgContainer(container);
            const c = await this._docker.getContainer(container.id);
            if (!c) {
                dbgc(`container not found, nothing to do`);
                continue;
            }
            try {
                dbgc(`stopping`);
                await c.stop();
            }
            catch (e) {
                dbgc(e);
                (0, core_1.logVerbose)(e);
            }
            try {
                dbgc(`removing`);
                await c.remove();
            }
            catch (e) {
                dbgc(e);
                (0, core_1.logVerbose)(e);
            }
            try {
                dbgc(`rm host path %s`, container.hostPath);
                await (0, promises_2.rm)(container.hostPath, {
                    recursive: true,
                    maxRetries: 3,
                    retryDelay: 1000,
                    force: true,
                });
            }
            catch (e) {
                dbgc(e);
                (0, core_1.logVerbose)(e);
            }
        }
        this.containers = [];
    }
    async stopContainer(id) {
        const c = this._docker?.getContainer(id);
        if (c) {
            dbg(`stopping container with id ${id}`);
            try {
                await c.stop();
            }
            catch {
                // Do not log error if container is already stopped
            }
            try {
                await c.remove();
            }
            catch (e) {
                (0, core_1.logError)(e);
            }
        }
        const i = this.containers.findIndex((c) => c.id === id);
        if (i > -1) {
            const container = this.containers[i];
            const dbgc = dbgContainer(container);
            try {
                dbgc(`rm host path`);
                await (0, promises_2.rm)(container.hostPath, {
                    recursive: true,
                    maxRetries: 3,
                    retryDelay: 1000,
                    force: true,
                });
            }
            catch (e) {
                dbgc(e);
                (0, core_1.logError)(e);
            }
            this.containers.splice(i, 1);
        }
    }
    async checkImage(image) {
        dbg(`checking if image ${image} exists`);
        await this.init();
        try {
            const info = await this._docker.getImage(image).inspect();
            return info?.Size > 0;
        }
        catch {
            // statusCode: 404
            dbg(`image ${image} does not exist`);
            return false;
        }
    }
    async pullImage(image, options) {
        await this.init();
        const { trace } = options || {};
        if (await this.checkImage(image)) {
            dbg(`image ${image} already exists, skipping pull`);
            return;
        }
        // pull image
        const dbgp = dbg.extend(`pull:${image}`);
        try {
            dbgp(`starting`);
            trace?.startDetails(`📥 pull image ${image}`);
            const res = await this._docker.pull(image);
            this._docker.modem.followProgress(res, (err) => {
                if (err) {
                    dbgp(err);
                    trace?.error(`failed to pull image ${image}`, err);
                }
            }, (ev) => {
                dbgp(ev.progress || ev.status);
                trace?.item(ev.progress || ev.status);
            });
            await (0, promises_1.finished)(res);
            dbgp(`done`);
        }
        catch (e) {
            dbgp(e);
            trace?.error(`failed to pull image ${image}`, e);
            throw e;
        }
        finally {
            trace?.endDetails();
        }
    }
    async container(id) {
        const c = this.containers.find((c) => c.id === id);
        return c;
    }
    async tryGetContainer(filters) {
        try {
            dbg(`listing containers with filters: ${JSON.stringify(filters)}`);
            const containers = await this._docker.listContainers({
                all: true,
                filters,
            });
            const info = containers?.[0];
            if (info) {
                dbg(`found container with id ${info.Id}`);
                return this._docker.getContainer(info.Id);
            }
            dbg(`no container found with the given filters`);
        }
        catch (e) {
            dbg(e);
        }
        return undefined;
    }
    async startContainer(options) {
        const { trace, ...dockerOptions } = options || {};
        dbg(`starting container %O`, dockerOptions);
        await this.init();
        if (dockerOptions.persistent) {
            dbg(`trying to find existing container`);
            const { name, hostPath } = await this.containerName(options);
            const c = this.containers.find((c) => c.name === name);
            if (c) {
                (0, core_1.logVerbose)(`container: reusing ${name}`);
                await c.resume();
                return c;
            }
            const container = await this.tryGetContainer({ name: [name] });
            if (container) {
                (0, core_1.logVerbose)(`container: reclaiming ${name}`);
                const c = await this.wrapContainer(container, options, name, hostPath);
                this.containers.push(c);
                (0, core_1.logVerbose)(`container: resuming ${name}`);
                await c.resume();
                const st = await container.inspect();
                const status = st.State?.Status;
                if (status !== "running") {
                    (0, core_1.logVerbose)(`container: start failed (${status})`);
                    trace?.error(`container: ${status}`);
                }
                return c;
            }
        }
        return await this._createQueue.add(async () => await this.internalStartContainer(options));
    }
    async containerName(options) {
        const { image = core_1.DOCKER_DEFAULT_IMAGE, persistent, name: userName, ports, postCreateCommands, env, networkEnabled, } = options;
        let name = (userName || image).replace(/[^a-zA-Z0-9]+/g, "_");
        if (persistent) {
            name += `_${await (0, core_1.hash)({ image, name, ports, env, networkEnabled, postCreateCommands, CORE_VERSION: core_1.CORE_VERSION }, { length: 12, version: true })}`;
        }
        else {
            name += `_${(0, core_1.generateId)()}`;
        }
        const hostPath = (0, node_path_1.resolve)((0, core_1.dotGenaiscriptPath)(core_1.DOCKER_VOLUMES_DIR, name));
        return { name, hostPath };
    }
    async internalStartContainer(options) {
        const { image = core_1.DOCKER_DEFAULT_IMAGE, trace, env = {}, networkEnabled, postCreateCommands, } = options;
        const ports = (0, core_1.arrayify)(options.ports);
        const { name, hostPath } = await this.containerName(options);
        try {
            dbg(`starting container with image ${image}`);
            trace?.startDetails(`📦 container start ${image}`);
            await this.pullImage(image, { trace });
            await (0, core_1.ensureDir)(hostPath);
            (0, core_1.logVerbose)(`container: create ${image} ${name || ""}`);
            const containerOptions = {
                name,
                Image: image,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                OpenStdin: false,
                StdinOnce: false,
                NetworkDisabled: false, // disable after post create commands
                WorkingDir: "/" + core_1.DOCKER_CONTAINER_VOLUME,
                Labels: {
                    genaiscript: "true",
                    "genaiscript.version": core_1.CORE_VERSION,
                    "genaiscript.hostpath": hostPath,
                },
                Env: Object.entries(env).map(([key, value]) => value === undefined || value === null ? key : `${key}=${value}`),
                ExposedPorts: ports.reduce((acc, { containerPort }) => {
                    acc[containerPort] = {};
                    return acc;
                }, {}),
                HostConfig: {
                    Binds: [`${hostPath}:/${core_1.DOCKER_CONTAINER_VOLUME}`],
                    PortBindings: ports?.reduce((acc, { containerPort, hostPort }) => {
                        acc[containerPort] = [{ HostPort: String(hostPort) }];
                        return acc;
                    }, {}),
                },
            };
            const container = await this._docker.createContainer(containerOptions);
            trace?.itemValue(`id`, container.id);
            trace?.itemValue(`host path`, hostPath);
            trace?.itemValue(`container path`, core_1.DOCKER_CONTAINER_VOLUME);
            const inspection = await container.inspect();
            trace?.itemValue(`container state`, inspection.State?.Status);
            const c = await this.wrapContainer(container, options, name, hostPath);
            this.containers.push(c);
            dbg(`container started with id ${container.id}`);
            await container.start();
            const st = await container.inspect();
            if (st.State?.Status !== "running") {
                (0, core_1.logVerbose)(`container: start failed`);
                trace?.error(`container: start failed`);
            }
            for (const command of (0, core_1.arrayify)(postCreateCommands)) {
                dbg(`executing post-create command: ${command}`);
                const [cmd, ...args] = (0, core_1.shellParse)(command);
                const res = await c.exec(cmd, args);
                if (res.failed) {
                    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${res.exitCode}`);
                }
            }
            if (!networkEnabled) {
                dbg(`disabling network for container`);
                await c.disconnect();
            }
            return c;
        }
        finally {
            trace?.endDetails();
        }
    }
    async wrapContainer(container, options, name, hostPath) {
        const { trace, persistent } = options;
        const dbgc = name ? dbg.extend(name) : dbg;
        const runtimeHost = (0, core_1.resolveRuntimeHost)();
        const stop = async () => {
            dbgc(`stopping`);
            await this.stopContainer(container.id);
        };
        const resolveContainerPath = (to) => {
            const res = /^\//.test(to)
                ? (0, node_path_1.resolve)(hostPath, to.replace(/^\//, ""))
                : (0, node_path_1.resolve)(hostPath, to || "");
            return res;
        };
        const resume = async () => {
            dbgc(`resuming`);
            let state = await container.inspect();
            if (state.State.Status === "paused") {
                dbgc(`unpausing`);
                await container.unpause();
            }
            else if (state.State.Status === "exited") {
                dbgc(`starting exited`);
                await container.start();
            }
            else if (state.State.Status === "restarting") {
                dbgc(`waiting for restarting container to stabilize`);
                let retry = 0;
                while (state.State.Restarting && retry++ < 5) {
                    await (0, es_toolkit_1.delay)(1000);
                    state = await container.inspect();
                }
            }
        };
        const pause = async () => {
            const state = await container.inspect();
            if (state.State.Running || state.State.Restarting) {
                dbgc(`pausing running or restarting`);
                await container.pause();
            }
        };
        const exec = async (command, args, options) => {
            dbgc(`exec %s %o`, command, args);
            // Parse the command and arguments if necessary
            if (!Array.isArray(args) && typeof args === "object") {
                // exec("cmd arg arg", {...})
                if (options !== undefined) {
                    throw new Error("Options must be the second argument");
                }
                options = args;
                const parsed = (0, core_1.shellParse)(command);
                command = parsed[0];
                args = parsed.slice(1);
            }
            else if (args === undefined) {
                // exec("cmd arg arg")
                const parsed = (0, core_1.shellParse)(command);
                command = parsed[0];
                args = parsed.slice(1);
            }
            const { cwd: userCwd, label } = options || {};
            const cwd = "/" + (0, node_path_1.join)(core_1.DOCKER_CONTAINER_VOLUME, userCwd || ".");
            try {
                trace?.startDetails(`📦 ▶️ container exec: ${userCwd || ""}> ${label || command}`);
                trace?.itemValue(`container`, container.id);
                trace?.itemValue(`cwd`, cwd);
                trace?.fence(`${cwd}> ${command} ${(0, core_1.shellQuote)(args || [])}`, "sh");
                if (!core_1.isQuiet) {
                    (0, core_1.logVerbose)(`container exec: ${userCwd || ""}> ${(0, core_1.shellQuote)([command, ...args])}`);
                }
                await resume();
                const exec = await container.exec({
                    Cmd: [command, ...args],
                    WorkingDir: cwd,
                    Privileged: false,
                    AttachStdin: false,
                    AttachStderr: true,
                    AttachStdout: true,
                });
                const stream = await exec.start({});
                const stdout = memorystream_1.default.createWriteStream();
                const stderr = memorystream_1.default.createWriteStream();
                container.modem.demuxStream(stream, stdout, stderr);
                await (0, promises_1.finished)(stream);
                stdout.end();
                stderr.end();
                const inspect = await exec.inspect();
                const exitCode = inspect.ExitCode;
                const sres = {
                    exitCode,
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    failed: exitCode !== 0,
                };
                trace?.resultItem(exitCode === 0, `exit code: ${sres.exitCode}`);
                if (sres.stdout) {
                    trace?.detailsFenced(`stdout`, sres.stdout, "txt");
                    if (!core_1.isQuiet) {
                        (0, core_1.logVerbose)(sres.stdout);
                    }
                }
                if (sres.stderr) {
                    trace?.detailsFenced(`stderr`, sres.stderr, "txt");
                    if (!core_1.isQuiet) {
                        (0, core_1.logVerbose)(sres.stderr);
                    }
                }
                return sres;
            }
            catch (e) {
                dbgc(e);
                trace?.error(`${command} failed`, e);
                return {
                    exitCode: -1,
                    failed: true,
                    stderr: (0, core_1.errorMessage)(e),
                };
            }
            finally {
                trace?.endDetails();
            }
        };
        const writeText = async (filename, content) => {
            dbgc(`write %s`, filename);
            const hostFilename = (0, node_path_1.resolve)(hostPath, resolveContainerPath(filename));
            await (0, core_1.ensureDir)((0, node_path_1.dirname)(hostFilename));
            await (0, promises_2.writeFile)(hostFilename, content ?? "", {
                encoding: "utf8",
            });
        };
        const readText = async (filename) => {
            dbgc(`read %s`, filename);
            const hostFilename = (0, node_path_1.resolve)(hostPath, resolveContainerPath(filename));
            try {
                return await (0, promises_2.readFile)(hostFilename, { encoding: "utf8" });
            }
            catch {
                return undefined;
            }
        };
        const copyTo = async (from, to, options) => {
            dbgc(`copy %o to %s %o`, from, to, options);
            const cto = resolveContainerPath(to);
            const files = await runtimeHost.findFiles(from, options);
            const res = [];
            for (const file of files) {
                const source = (0, node_path_1.resolve)(file);
                const target = (0, node_path_1.resolve)(cto, (0, node_path_1.basename)(file));
                await (0, core_1.ensureDir)((0, node_path_1.dirname)(target));
                await (0, promises_2.copyFile)(source, target);
                res.push((0, node_path_1.join)(to, (0, node_path_1.basename)(file)));
            }
            return res;
        };
        const listFiles = async (to) => {
            dbgc(`list files %s`, to);
            const source = (0, node_path_1.resolve)(hostPath, resolveContainerPath(to));
            try {
                const files = await (0, promises_2.readdir)(source);
                return files;
            }
            catch {
                return [];
            }
        };
        const disconnect = async () => {
            dbgc(`disconnect network`);
            const networks = await this._docker.listNetworks();
            for (const network of networks.filter(({ Name }) => Name === "bridge")) {
                const n = this._docker.getNetwork(network.Id);
                if (n) {
                    const state = await n.inspect();
                    if (state?.Containers?.[container.id]) {
                        (0, core_1.logVerbose)(`container: disconnect ${network.Name}`);
                        await n.disconnect({ Container: container.id });
                    }
                }
            }
        };
        const c = Object.freeze({
            id: container.id,
            name,
            persistent,
            hostPath,
            stop,
            exec,
            writeText,
            readText,
            copyTo,
            listFiles,
            disconnect,
            pause,
            resume,
            scheduler: new core_1.PLimitPromiseQueue(1),
        });
        return c;
    }
}
exports.DockerManager = DockerManager;
//# sourceMappingURL=docker.js.map