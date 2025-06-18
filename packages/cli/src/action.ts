// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resolve } from "node:path";
import { snakeCase } from "es-toolkit";
import {
  CORE_VERSION,
  GENAI_ANY_REGEX,
  GENAI_SRC,
  GitHubClient,
  YAMLStringify,
  YAMLTryParse,
  createScript as coreCreateScript,
  dedent,
  deleteUndefinedValues,
  genaiscriptDebug,
  logInfo,
  logVerbose,
  nodeTryReadPackage,
  runtimeHost,
  templateIdFromFileName,
  tryStat,
  writeText,
} from "@genaiscript/core";
import { buildProject } from "./build.js";
import type { JSONSchemaDescribed, JSONSchemaObject } from "@genaiscript/core";

const dbg = genaiscriptDebug("cli:action");

const github = GitHubClient.default();

interface GitHubActionFieldType {
  description: string;
  required?: boolean;
  default?: string;
}

/**
 * Generates GitHub Action files for a given script, including action.yml, Dockerfile, package.json, README.md, and .gitignore, using script metadata and provided options.
 *
 * If scriptId is not provided, prompts the user for the script name and initializes a new script. If scriptId is given, attempts to load the script from the project.
 *
 * Parameters:
 *   scriptId: The identifier or filename of the script for which action files will be generated. If falsy, user will be prompted to enter a name and a new script will be created.
 *   options: Configuration object with the following optional properties:
 *     force: If true, overwrite existing files without prompting.
 *     out: Output directory for generated files. Defaults to action/<script.id> under the genaiscript workspace.
 *     ffmpeg: If true, install ffmpeg in the Docker image.
 *     python: If true, install python3 and py3-pip in the Docker image.
 *     playwright: If true, use Playwright Docker image and install Playwright dependencies.
 *     packageLock: If true, generate a package-lock.json file using npm ci or npm install.
 *     image: Base Docker image to use. Defaults to Playwright image if playwright flag is set, otherwise node:lts-alpine.
 *     apks: Additional Alpine packages to install in the Docker image.
 *     provider: Name of the GenAI provider to use in the start command.
 *
 * Throws:
 *   Error if the script cannot be found when scriptId is provided.
 *
 * Side Effects:
 *   Writes or overwrites files in the output directory.
 *   Executes npm or node commands to generate lock files if packageLock is set.
 */
export async function actionConfigure(options: {
  force?: boolean;
  out?: string;
  ffmpeg?: boolean;
  python?: boolean;
  playwright?: boolean;
  image?: string;
  apks?: string[];
  provider?: string;
  pullRequestComment?: string | boolean;
  pullRequestDescription?: string | boolean;
  pullRequestReviews?: boolean;
  event?: string;
}) {
  const {
    force,
    out = resolve("."),
    provider,
    pullRequestComment,
    pullRequestDescription,
    pullRequestReviews,
  } = options || {};
  const event: "push" | "pull_request" | "issue_comment" | "issue" =
    (options?.event as any) ??
    (pullRequestComment || pullRequestDescription || pullRequestReviews ? "pull_request" : "push");
  const issue =
    event === "issue" ||
    event === "issue_comment" ||
    pullRequestComment ||
    pullRequestDescription ||
    pullRequestReviews;
  const { owner, repo } = (await github.info()) || {};
  if (!owner || !repo) throw new Error("GitHub repository information not found.");
  const scriptId = "action";
  dbg(`owner: %s`, owner);
  dbg(`repo: %s`, repo);
  dbg(`script: %s`, scriptId);

  const writeFile = async (name: string, content: string) => {
    const filePath = resolve(out, name);
    if (!force && (await tryStat(filePath))) {
      logInfo(`skipping ${filePath} (file already exists), use --force to overwrite`);
    } else {
      logVerbose(`writing ${filePath}`);
      await writeText(filePath, content);
    }
  };
  logVerbose(`event: ${event}`);

  const prj = await buildProject(); // Build the project to get script templates
  let script = prj.scripts.find(
    (t) =>
      t.id === scriptId ||
      (t.filename && GENAI_ANY_REGEX.test(scriptId) && resolve(t.filename) === resolve(scriptId)),
  );
  if (!script) {
    script = coreCreateScript(scriptId);
    script.id = scriptId;
    script.filename = resolve(out, GENAI_SRC, templateIdFromFileName(scriptId) + ".genai.mts");
    // Write the prompt script to the determined path
    await writeFile(script.filename, script.jsSource);
  }
  const ffmpeg = options?.ffmpeg || /ffmpeg$/.test(script.jsSource);
  const playwright = options?.playwright || /host\.browser/.test(script.jsSource);
  const python = options?.python;
  const image =
    options.image ||
    (playwright ? "mcr.microsoft.com/playwright:v1.52.0-noble" : "node:lts-alpine");
  const alpine = /alpine$/.test(image);
  logVerbose(`script: ${script.filename}`);
  logVerbose(`docker image: ${image}`);
  logVerbose(`ffmpeg: ${ffmpeg}`);
  logVerbose(`python: ${python}`);
  logVerbose(`playwright: ${playwright}`);
  const { inputSchema, branding } = script;
  const scriptSchema = (inputSchema?.properties.script as JSONSchemaObject) || {
    type: "object",
    properties: {},
    required: [],
  };
  const inputs: Record<string, GitHubActionFieldType> = deleteUndefinedValues({
    ...Object.fromEntries(
      Object.entries(scriptSchema.properties).map(([key, value]) => {
        return [
          snakeCase(key),
          {
            description: (value as JSONSchemaDescribed).description || "",
            required: scriptSchema.required?.includes(key) || false,
            default: (value as any).default ?? undefined,
          } satisfies GitHubActionFieldType,
        ];
      }),
    ),
    github_token: {
      description: "GitHub token with `models: read` permission at least.",
      required: true,
    },
    github_issue:
      event !== "pull_request" && issue
        ? {
            description: "GitHub issue number to use when generating comments.",
          }
        : undefined,
    debug: {
      description: "Enable debug logging.",
      required: false,
    },
  });
  const outputs: Record<string, GitHubActionFieldType> = {
    text: {
      description: "The generated text output.",
    },
    data: {
      description: "The generated JSON data output, parsed and stringified.",
    },
  };

  const pkg = await nodeTryReadPackage();
  const apks = [
    "git",
    python ? "python3" : undefined,
    python ? "py3-pip" : undefined,
    ffmpeg ? "ffmpeg" : undefined,
    ...(options?.apks || []),
  ].filter(Boolean);

  const action = YAMLTryParse({ filename: "action.yml" });
  if (action && !force) {
    logVerbose(`action.yml already exists, using existing values`);
    action.description = script.title || pkg?.description;
    action.inputs = inputs;
    action.branding = branding;
    await writeFile("action.yml", YAMLStringify(action));
  } else
    await writeFile(
      "action.yml",
      YAMLStringify(
        deleteUndefinedValues({
          name: repo,
          author: pkg?.author,
          description: script.title || pkg?.description,
          inputs,
          outputs,
          branding,
          runs: {
            using: "docker",
            image: "Dockerfile",
          },
        }),
      ),
    );

  await writeFile(
    "Dockerfile",
    dedent`# For additional guidance on containerized actions, see https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action
FROM ${image}

# Install packages
${alpine ? `RUN apk add --no-cache ${apks.join(" ")}` : `RUN apt-get update && apt-get install -y ${apks.join(" ")}`}

# Set working directory
WORKDIR /genaiscript/action

# Copy source code
COPY . .

# Install dependencies
RUN npm ci

${
  playwright
    ? dedent`# Install playwright dependencies
RUN npx playwright install --with-deps

`
    : ""
}
# GitHub Action forces the WORKDIR to GITHUB_WORKSPACE 
ENTRYPOINT ["npm", "--prefix", "/genaiscript/action", "start"]
`,
  );
  await writeFile(
    "README.md",
    dedent`# ${script.id} action

${script.description || ""}

## Inputs

${Object.entries(inputs || {})
  .map(
    ([key, value]) =>
      `- \`${key}\`: ${value.description}${
        value.required ? " (required)" : ""
      }${value.default ? ` (default: \`${value.default}\`)` : ""}`,
  )
  .join("\n")}

## Outputs

${Object.entries(outputs || {})
  .map(
    ([key, value]) =>
      `- \`${key}\`: ${value.description || ""}${
        value.required ? " (required)" : ""
      }${value.default ? ` (default: \`${value.default}\`)` : ""}`,
  )
  .join("\n")}

## Usage

Add the following to your step in your workflow file:

\`\`\`yaml
uses: ${owner}/${repo}@main
with:
${Object.entries(inputs || {})
  .filter(([, value]) => value.required)
  .map(
    ([key, value]) =>
      `  ${key}: \${{ ${key === "github_token" ? "secrets.GITHUB_TOKEN" : "..."} }}`,
  )
  .join("\n")}
\`\`\`

## Example

\`\`\`yaml
name: My action
on:
    ${event}:
permissions:
    contents: read
    ${!issue ? "# " : ""}issues: write
    ${event !== "pull_request" ? "# " : ""}pull-requests: write
    models: read
concurrency:
    group: \${{ github.workflow }}-\${{ github.ref }}
    cancel-in-progress: true
jobs:
  run-script:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${owner}/${repo}@main
        with:
${Object.entries(inputs || {})
  .filter(([, value]) => value.required)
  .map(
    ([key, value]) =>
      `          ${key}: \${{ ${key === "github_token" ? "secrets.GITHUB_TOKEN" : "..."} }}`,
  )
  .join("\n")}
\`\`\`

## Development

This action was automatically generated by GenAIScript from the script metadata.
We recommend updating the script metadata instead of editing the action files directly.

- the action inputs are inferred from the script parameters
- the action outputs are inferred from the script output schema
- the action description is the script title
- the readme description is the script description
- the action branding is the script branding

To **regenerate** the action files (\`action.yml\`, \`Dockerfile\`, \`README.md\`, \`package.json\`, \`.gitignore\`), run:

\`\`\`bash
npm run configure
\`\`\`

> [!CAUTION]
> This will overwrite any changes you made to these files!

To lint script files, run:

\`\`\`bash
npm run lint
\`\`\`

To typecheck the scripts, run:
\`\`\`bash
npm run typecheck
\`\`\`

To build the Docker image locally, run:
\`\`\`bash
npm run docker:build
\`\`\`

To run the action locally in Docker (build it first), use:
\`\`\`bash
npm run docker:start
\`\`\`

To run the action using [act](https://nektosact.com/), first install the act CLI:

\`\`\`bash
npm run act:install
\`\`\`

Then, you can run the action with:

\`\`\`bash
npm run act
\`\`\`

## Upgrade

The GenAIScript version is pinned in the \`package.json\` file. To upgrade it, run:

\`\`\`bash
npm run upgrade
\`\`\`

`,
  );
  await writeFile(
    ".gitignore",
    dedent`node_modules
.genaiscript
.env
.*.env
.env.*
`,
  );

  await writeFile(
    ".github/workflows/ci.yml",
    `name: Continuous Integration
on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: npm
      - run: npm ci
      - run: npm test
  test-action:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
${issue ? `          github_issue: \${{ github.event.issue.number }}` : ""}
`,
  );

  if (!pkg || force) {
    await writeFile(
      "package.json",
      JSON.stringify(
        deleteUndefinedValues({
          author: pkg.author,
          license: pkg.license,
          description: script.description,
          dependencies: {
            ...(pkg.dependencies || {}),
            genaiscript: CORE_VERSION,
          },
          scripts: {
            upgrade: "npx -y npm-check-updates -u && npm install",
            "docker:build": `docker build -t ${owner}-${repo} .`,
            "docker:start": `docker run -e GITHUB_TOKEN ${owner}-${repo}`,
            "act:install": "gh extension install https://github.com/nektos/gh-act",
            act: "gh act",
            lint: `npx --yes prettier --write genaisrc/`,
            fix: "genaiscript scripts fix",
            typecheck: `genaiscript scripts compile`,
            configure: [`genaiscript configure action`].filter(Boolean).join(" "),
            test: "echo 'No tests defined.'",
            start: [
              `genaiscript`,
              `run`,
              scriptId,
              `--github-workspace`,
              provider ? `--provider` : undefined,
              provider,
              pullRequestComment ? `--pull-request-comment` : undefined,
              typeof pullRequestComment === "string" ? pullRequestComment : undefined,
              pullRequestDescription ? `--pull-request-description` : undefined,
              typeof pullRequestDescription === "string" ? pullRequestDescription : undefined,
              pullRequestReviews ? `--pull-request-reviews` : undefined,
            ]
              .filter(Boolean)
              .join(" "),
          },
        }),
        null,
        2,
      ),
    );
  }

  // upgrade dependencies
  await runtimeHost.exec(undefined, "node", ["run", "upgrade"], {
    cwd: out,
  });

  // fix scripts
  await runtimeHost.exec(undefined, "npm", ["run", "fix"], { cwd: out });
}
