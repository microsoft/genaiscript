// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import MemoryStream from "memorystream";
import { finished } from "node:stream/promises";
import { copyFile, readFile, readdir, rm, writeFile } from "fs/promises";
import Dockerode, { Container } from "dockerode";
import { delay } from "es-toolkit";
import {
  CORE_VERSION,
  DOCKER_CONTAINER_VOLUME,
  DOCKER_DEFAULT_IMAGE,
  DOCKER_VOLUMES_DIR,
  PLimitPromiseQueue,
  arrayify,
  dotGenaiscriptPath,
  ensureDir,
  errorMessage,
  genaiscriptDebug,
  generateId,
  hash,
  host,
  isQuiet,
  logError,
  logVerbose,
  shellParse,
  shellQuote,
} from "@genaiscript/core";
import type {
  ContainerHost,
  ContainerOptions,
  FindFilesOptions,
  ShellOptions,
  ShellOutput,
  TraceOptions,
} from "@genaiscript/core";
const dbg = genaiscriptDebug("docker");

type DockerodeType = import("dockerode");

function dbgContainer(c: ContainerHost) {
  const name = c?.name;
  return name ? dbg.extend(name) : dbg;
}

export class DockerManager {
  private containers: ContainerHost[] = [];
  private _docker: DockerodeType;
  private _createQueue: PLimitPromiseQueue;

  constructor() {
    this._createQueue = new PLimitPromiseQueue(1);
  }

  private async init() {
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
      logVerbose(`container: removing ${container.id}`);
      const dbgc = dbgContainer(container);
      const c = await this._docker.getContainer(container.id);
      if (!c) {
        dbgc(`container not found, nothing to do`);
        continue;
      }
      try {
        dbgc(`stopping`);
        await c.stop();
      } catch (e) {
        dbgc(e);
        logVerbose(e);
      }
      try {
        dbgc(`removing`);
        await c.remove();
      } catch (e) {
        dbgc(e);
        logVerbose(e);
      }
      try {
        dbgc(`rm host path %s`, container.hostPath);
        await rm(container.hostPath, {
          recursive: true,
          maxRetries: 3,
          retryDelay: 1000,
          force: true,
        });
      } catch (e) {
        dbgc(e);
        logVerbose(e);
      }
    }
    this.containers = [];
  }

  async stopContainer(id: string) {
    const c = this._docker?.getContainer(id);
    if (c) {
      dbg(`stopping container with id ${id}`);
      try {
        await c.stop();
      } catch {
        // Do not log error if container is already stopped
      }
      try {
        await c.remove();
      } catch (e) {
        logError(e);
      }
    }
    const i = this.containers.findIndex((c) => c.id === id);
    if (i > -1) {
      const container = this.containers[i];
      const dbgc = dbgContainer(container);
      try {
        dbgc(`rm host path`);
        await rm(container.hostPath, {
          recursive: true,
          maxRetries: 3,
          retryDelay: 1000,
          force: true,
        });
      } catch (e) {
        dbgc(e);
        logError(e);
      }
      this.containers.splice(i, 1);
    }
  }

  async checkImage(image: string) {
    dbg(`checking if image ${image} exists`);
    await this.init();
    try {
      const info = await this._docker.getImage(image).inspect();
      return info?.Size > 0;
    } catch {
      // statusCode: 404
      dbg(`image ${image} does not exist`);
      return false;
    }
  }

  async pullImage(image: string, options?: TraceOptions) {
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
      this._docker.modem.followProgress(
        res,
        (err) => {
          if (err) {
            dbgp(err);
            trace?.error(`failed to pull image ${image}`, err);
          }
        },
        (ev) => {
          dbgp(ev.progress || ev.status);
          trace?.item(ev.progress || ev.status);
        },
      );
      await finished(res);
      dbgp(`done`);
    } catch (e) {
      dbgp(e);
      trace?.error(`failed to pull image ${image}`, e);
      throw e;
    } finally {
      trace?.endDetails();
    }
  }

  async container(id: string): Promise<ContainerHost> {
    const c = this.containers.find((c) => c.id === id);
    return c;
  }

  private async tryGetContainer(filters: { id?: string[]; name?: string[] }): Promise<Container> {
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
    } catch (e) {
      dbg(e);
    }
    return undefined;
  }

  async startContainer(options: ContainerOptions & TraceOptions): Promise<ContainerHost> {
    const { trace, ...dockerOptions } = options || {};
    dbg(`starting container %O`, dockerOptions);
    await this.init();
    if (dockerOptions.persistent) {
      dbg(`trying to find existing container`);
      const { name, hostPath } = await this.containerName(options);
      const c = this.containers.find((c) => c.name === name);
      if (c) {
        logVerbose(`container: reusing ${name}`);
        await c.resume();
        return c;
      }
      const container = await this.tryGetContainer({ name: [name] });
      if (container) {
        logVerbose(`container: reclaiming ${name}`);
        const c = await this.wrapContainer(container, options, name, hostPath);
        this.containers.push(c);
        logVerbose(`container: resuming ${name}`);
        await c.resume();
        const st = await container.inspect();
        const status = st.State?.Status;
        if (status !== "running") {
          logVerbose(`container: start failed (${status})`);
          trace?.error(`container: ${status}`);
        }
        return c;
      }
    }
    return await this._createQueue.add(async () => await this.internalStartContainer(options));
  }

  private async containerName(options: ContainerOptions): Promise<{
    name: string;
    hostPath: string;
  }> {
    const {
      image = DOCKER_DEFAULT_IMAGE,
      persistent,
      name: userName,
      ports,
      postCreateCommands,
      env,
      networkEnabled,
    } = options;
    let name = (userName || image).replace(/[^a-zA-Z0-9]+/g, "_");
    if (persistent) {
      name += `_${await hash({ image, name, ports, env, networkEnabled, postCreateCommands, CORE_VERSION }, { length: 12, version: true })}`;
    } else {
      name += `_${generateId()}`;
    }
    const hostPath = host.path.resolve(dotGenaiscriptPath(DOCKER_VOLUMES_DIR, name));
    return { name, hostPath };
  }

  private async internalStartContainer(
    options: ContainerOptions & TraceOptions,
  ): Promise<ContainerHost> {
    const {
      image = DOCKER_DEFAULT_IMAGE,
      trace,
      env = {},
      networkEnabled,
      postCreateCommands,
    } = options;
    const ports = arrayify(options.ports);
    const { name, hostPath } = await this.containerName(options);
    try {
      dbg(`starting container with image ${image}`);
      trace?.startDetails(`📦 container start ${image}`);
      await this.pullImage(image, { trace });
      await ensureDir(hostPath);

      logVerbose(`container: create ${image} ${name || ""}`);
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
          value === undefined || value === null ? key : `${key}=${value}`,
        ),
        ExposedPorts: ports.reduce(
          (acc, { containerPort }) => {
            acc[containerPort] = {};
            return acc;
          },
          <Record<string, any>>{},
        ),
        HostConfig: {
          Binds: [`${hostPath}:/${DOCKER_CONTAINER_VOLUME}`],
          PortBindings: ports?.reduce(
            (acc, { containerPort, hostPort }) => {
              acc[containerPort] = [{ HostPort: String(hostPort) }];
              return acc;
            },
            <Record<string, { HostPort: string }[]>>{},
          ),
        },
      };
      const container = await this._docker.createContainer(containerOptions);
      trace?.itemValue(`id`, container.id);
      trace?.itemValue(`host path`, hostPath);
      trace?.itemValue(`container path`, DOCKER_CONTAINER_VOLUME);
      const inspection = await container.inspect();
      trace?.itemValue(`container state`, inspection.State?.Status);

      const c = await this.wrapContainer(container, options, name, hostPath);
      this.containers.push(c);
      dbg(`container started with id ${container.id}`);
      await container.start();
      const st = await container.inspect();
      if (st.State?.Status !== "running") {
        logVerbose(`container: start failed`);
        trace?.error(`container: start failed`);
      }
      for (const command of arrayify(postCreateCommands)) {
        dbg(`executing post-create command: ${command}`);
        const [cmd, ...args] = shellParse(command);
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
    } finally {
      trace?.endDetails();
    }
  }

  private async wrapContainer(
    container: Dockerode.Container,
    options: Omit<ContainerOptions, "name" | "hostPath"> & TraceOptions,
    name: string,
    hostPath: string,
  ): Promise<ContainerHost> {
    const { trace, persistent } = options;
    const dbgc = name ? dbg.extend(name) : dbg;

    const stop: () => Promise<void> = async () => {
      dbgc(`stopping`);
      await this.stopContainer(container.id);
    };

    const resolveContainerPath = (to: string) => {
      const res = /^\//.test(to)
        ? host.path.resolve(hostPath, to.replace(/^\//, ""))
        : host.path.resolve(hostPath, to || "");
      return res;
    };

    const resume: () => Promise<void> = async () => {
      dbgc(`resuming`);
      let state = await container.inspect();
      if (state.State.Status === "paused") {
        dbgc(`unpausing`);
        await container.unpause();
      } else if (state.State.Status === "exited") {
        dbgc(`starting exited`);
        await container.start();
      } else if (state.State.Status === "restarting") {
        dbgc(`waiting for restarting container to stabilize`);
        let retry = 0;
        while (state.State.Restarting && retry++ < 5) {
          await delay(1000);
          state = await container.inspect();
        }
      }
    };

    const pause: () => Promise<void> = async () => {
      const state = await container.inspect();
      if (state.State.Running || state.State.Restarting) {
        dbgc(`pausing running or restarting`);
        await container.pause();
      }
    };

    const exec = async (
      command: string,
      args?: string[] | ShellOptions,
      options?: ShellOptions,
    ): Promise<ShellOutput> => {
      dbgc(`exec %s %o`, command, args);

      // Parse the command and arguments if necessary
      if (!Array.isArray(args) && typeof args === "object") {
        // exec("cmd arg arg", {...})
        if (options !== undefined) {
          throw new Error("Options must be the second argument");
        }
        options = args as ShellOptions;
        const parsed = shellParse(command);
        command = parsed[0];
        args = parsed.slice(1);
      } else if (args === undefined) {
        // exec("cmd arg arg")
        const parsed = shellParse(command);
        command = parsed[0];
        args = parsed.slice(1);
      }

      const { cwd: userCwd, label } = options || {};
      const cwd = "/" + host.path.join(DOCKER_CONTAINER_VOLUME, userCwd || ".");

      try {
        trace?.startDetails(`📦 ▶️ container exec: ${userCwd || ""}> ${label || command}`);
        trace?.itemValue(`container`, container.id);
        trace?.itemValue(`cwd`, cwd);
        trace?.fence(`${cwd}> ${command} ${shellQuote(args || [])}`, "sh");
        if (!isQuiet) {
          logVerbose(`container exec: ${userCwd || ""}> ${shellQuote([command, ...args])}`);
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
        const stdout = MemoryStream.createWriteStream();
        const stderr = MemoryStream.createWriteStream();
        container.modem.demuxStream(stream, stdout, stderr);
        await finished(stream);
        stdout.end();
        stderr.end();
        const inspect = await exec.inspect();
        const exitCode = inspect.ExitCode;

        const sres: ShellOutput = {
          exitCode,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          failed: exitCode !== 0,
        };
        trace?.resultItem(exitCode === 0, `exit code: ${sres.exitCode}`);
        if (sres.stdout) {
          trace?.detailsFenced(`stdout`, sres.stdout, "txt");
          if (!isQuiet) {
            logVerbose(sres.stdout);
          }
        }
        if (sres.stderr) {
          trace?.detailsFenced(`stderr`, sres.stderr, "txt");
          if (!isQuiet) {
            logVerbose(sres.stderr);
          }
        }
        return sres;
      } catch (e) {
        dbgc(e);
        trace?.error(`${command} failed`, e);
        return {
          exitCode: -1,
          failed: true,
          stderr: errorMessage(e),
        };
      } finally {
        trace?.endDetails();
      }
    };

    const writeText = async (filename: string, content: string) => {
      dbgc(`write %s`, filename);
      const hostFilename = host.path.resolve(hostPath, resolveContainerPath(filename));
      await ensureDir(host.path.dirname(hostFilename));
      await writeFile(hostFilename, content ?? "", {
        encoding: "utf8",
      });
    };

    const readText = async (filename: string) => {
      dbgc(`read %s`, filename);
      const hostFilename = host.path.resolve(hostPath, resolveContainerPath(filename));
      try {
        return await readFile(hostFilename, { encoding: "utf8" });
      } catch {
        return undefined;
      }
    };

    const copyTo = async (
      from: string | string[],
      to: string,
      options?: Omit<FindFilesOptions, "readText">,
    ): Promise<string[]> => {
      dbgc(`copy %o to %s %o`, from, to, options);
      const cto = resolveContainerPath(to);
      const files = await host.findFiles(from, options);
      const res: string[] = [];
      for (const file of files) {
        const source = host.path.resolve(file);
        const target = host.path.resolve(cto, host.path.basename(file));
        await ensureDir(host.path.dirname(target));
        await copyFile(source, target);
        res.push(host.path.join(to, host.path.basename(file)));
      }
      return res;
    };

    const listFiles = async (to: string) => {
      dbgc(`list files %s`, to);
      const source = host.path.resolve(hostPath, resolveContainerPath(to));
      try {
        const files = await readdir(source);
        return files;
      } catch {
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
            logVerbose(`container: disconnect ${network.Name}`);
            await n.disconnect({ Container: container.id });
          }
        }
      }
    };

    const c = Object.freeze<ContainerHost>({
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
      scheduler: new PLimitPromiseQueue(1),
    });
    return c;
  }
}
