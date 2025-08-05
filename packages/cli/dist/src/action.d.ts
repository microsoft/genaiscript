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
export declare function actionConfigure(scriptId: string, options: {
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
    interactive?: boolean;
}): Promise<void>;
//# sourceMappingURL=action.d.ts.map