"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryResolveResource = tryResolveResource;
const node_url_1 = require("node:url");
const binary_js_1 = require("./binary.js");
const cancellation_js_1 = require("./cancellation.js");
const debug_js_1 = require("./debug.js");
const fetch_js_1 = require("./fetch.js");
const githubclient_js_1 = require("./githubclient.js");
const url_js_1 = require("./url.js");
const cleaners_js_1 = require("./cleaners.js");
const node_url_2 = require("node:url");
const git_js_1 = require("./git.js");
const fs_js_1 = require("./fs.js");
const node_path_1 = require("node:path");
const error_js_1 = require("./error.js");
const constants_js_1 = require("./constants.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("res");
const dbgAdaptors = dbg.extend("adaptors");
const dbgFiles = dbg.extend("files");
dbgFiles.enabled = false;
const urlAdapters = [
    {
        id: "github blob",
        /**
         * Matches GitHub blob URLs and converts them to raw content URLs.
         * Extracts user, repository, and file path from the blob URL.
         * Constructs a raw URL using the extracted components.
         * @param url - The GitHub blob URL.
         * @returns The corresponding raw URL or undefined if no match is found.
         */
        matcher: (url) => {
            const m = /^https:\/\/github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<path>.+)#?/i.exec(url);
            return m
                ? `https://raw.githubusercontent.com/${m.groups.owner}/${m.groups.repo}/refs/heads/${m.groups.path}`
                : undefined;
        },
    },
    {
        id: "github assets",
        matcher: async (url) => {
            if (constants_js_1.GITHUB_ASSET_URL_RX.test(url)) {
                const client = githubclient_js_1.GitHubClient.default();
                const resolved = await client.resolveAssetUrl(url);
                return resolved;
            }
            return undefined;
        },
    },
    {
        id: "gist",
        matcher: (url) => {
            const m = /^https:\/\/(gist\.)?github\.com\/(?<owner>[^\/]+)\/(?<id>\w+)(\/(?<filename>.*))?$/i.exec(url);
            return m ? `gist://${m.groups.id}/${m.groups.filename || ""}` : undefined;
        },
    },
];
async function applyUrlAdapters(url) {
    // Use URL adapters to modify the URL if needed
    for (const a of urlAdapters) {
        const newUrl = await a.matcher(url);
        if (newUrl) {
            dbgAdaptors(`%s: %s`, a.id, (0, url_js_1.uriRedact)(url));
            return newUrl;
        }
    }
    return url;
}
const uriResolvers = {
    file: async (dbg, uri) => {
        const filename = (0, node_url_1.fileURLToPath)(uri);
        const file = { filename };
        return file;
    },
    https: async (dbg, url, options) => {
        // https://.../.../....git
        if (/\.git($|\/)/.test(url.pathname))
            return await uriResolvers.git(dbg, url, options);
        // regular fetch
        const fetch = await (0, fetch_js_1.createFetch)(options);
        dbg(`fetch %s`, (0, url_js_1.uriRedact)(url.href));
        const res = await fetch(url, { method: "GET" });
        dbg(`res: %d %s`, res.status, res.statusText);
        if (!res.ok)
            return undefined;
        const contentType = res.headers.get("Content-Type");
        if ((0, binary_js_1.isBinaryMimeType)(contentType)) {
            const buffer = await res.arrayBuffer();
            return {
                filename: url.pathname,
                content: Buffer.from(buffer).toString("base64"),
                encoding: "base64",
                type: contentType,
                size: buffer.byteLength,
            };
        }
        else {
            const content = await res.text();
            return {
                filename: url.pathname,
                content,
                type: contentType,
                size: Buffer.byteLength(content, "utf8"),
            };
        }
    },
    gist: async (dbg, url) => {
        // gist://id/
        // gist://id/filename
        const gh = githubclient_js_1.GitHubClient.default();
        const id = url.hostname;
        const filename = url.pathname.slice(1) || "";
        if (!id) {
            dbg(`missing gist id or filename`);
            return undefined;
        }
        dbg(`gist %s %s`, id, filename);
        const gist = await gh.getGist(id);
        if (!gist) {
            dbg(`missing gist %s`, id);
            return undefined;
        }
        const files = gist.files || [];
        if (filename) {
            dbg(`moving file %s to top`, filename);
            const i = gist.files.findIndex((f) => f.filename === filename);
            if (i < 0) {
                dbg(`file %s not found in gist`, filename);
                return undefined;
            }
            const file = files[i];
            files.splice(i, 1);
            files.unshift(file);
        }
        return files;
    },
    vscode: async (dbg, url) => {
        // vscode://vsls-contrib.gistfs/open?gist=8f7db2674f7b0eaaf563eae28253c2b0&file=poem.genai.mts
        if (url.host === "vsls-contrib.gistfs" && url.pathname === "/open") {
            const params = new URLSearchParams(url.search);
            const gist = params.get("gist");
            const file = params.get("file") || "";
            if (!gist) {
                dbg(`missing gist id %s`, gist);
                return undefined;
            }
            return await uriResolvers.gist(dbg, new node_url_2.URL(`gist://${gist}/${file}`));
        }
        return undefined;
    },
    git: async (dbg, url) => {
        // (git|https)://github.com/pelikhan/amazing-demo.git(/....)
        let [owner, repo, ...filename] = url.pathname.replace(/^\//, "").split("/");
        repo = repo.replace(/\.git$/, "");
        const repository = [url.origin, owner, repo].join("/");
        const branch = url.hash.replace(/^#/, "");
        dbg(`git %s %s %s`, repository, branch, filename);
        const client = await git_js_1.GitClient.default();
        const clone = await client.shallowClone(repository, {
            branch,
        });
        const cwd = clone.cwd;
        const glob = filename.length ? (0, node_path_1.join)(...filename) : "**/*";
        dbg(`cloned at %s, glob %s`, cwd, glob);
        const gitFolder = (0, node_path_1.join)(cwd, ".git");
        const files = (await (0, fs_js_1.expandFiles)([(0, node_path_1.join)(cwd, glob)], {
            applyGitIgnore: false,
        })).filter((f) => !f.startsWith(gitFolder));
        return files.map((filename) => ({ filename }));
    },
};
/**
 * Attempts to resolve a given URL to its associated resources or files.
 *
 * @param url The input URL to resolve.
 * @param options Optional tracing and cancellation options to control the operation.
 *     - cancellationToken: Allows monitoring and cancellation of the operation.
 *
 * @returns A promise that resolves to an object containing:
 *     - uri: The parsed valid URL object.
 *     - files: An array of resolved files associated with the resource.
 * Returns undefined if the URL cannot be resolved or if no associated files are found.
 *
 * - Uses `applyUrlAdapters` to modify the URL if needed.
 * - Validates and parses the URL.
 * - Determines the scheme/protocol of the URL and invokes the appropriate resolver from `uriResolvers`.
 * - Resolves resources by downloading or fetching content based on the URL scheme.
 * - Handles both text and binary content.
 * - Reports errors or unsupported protocols.
 * - Cancels the process if the cancellation token is triggered.
 * - Logs debug information about the resolution process and resolved files.
 * - Throws an error if the cancellation token is triggered during the operation.
 */
async function tryResolveResource(url, options) {
    if (!url)
        return undefined;
    url = await applyUrlAdapters(url);
    const uri = (0, url_js_1.uriTryParse)(url);
    if (!uri)
        return undefined;
    const { cancellationToken } = options || {};
    dbg(`resolving %s`, (0, url_js_1.uriRedact)(url));
    try {
        // try to resolve
        const scheme = (0, url_js_1.uriScheme)(uri);
        const resolver = uriResolvers[scheme];
        if (!resolver) {
            dbg(`unsupported protocol %s`, scheme);
            return undefined;
        }
        // download
        const dbgUri = dbg.extend(uri.protocol.replace(/:$/, ""));
        const files = (0, cleaners_js_1.arrayify)(await resolver(dbgUri, uri, options));
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        dbg(`resolved %d files`, files.length);
        dbgFiles("%O", files.map((f) => f.filename));
        if (!files.length) {
            dbg(`failed to resolve %s`, (0, url_js_1.uriRedact)(uri.href));
            return undefined;
        }
        // success
        return { uri, files };
    }
    catch (error) {
        if ((0, error_js_1.isCancelError)(error))
            throw error;
        dbg(`failed to parse uri %s`, (0, url_js_1.uriRedact)(uri.href), error);
        return undefined;
    }
}
//# sourceMappingURL=resources.js.map