system({
  title: "Read resource content from a URL using MCP resource resolution",
  description:
    "Provides a tool that can read and return the content of resources from URLs using the host's resolveResource function. Supports various protocols including https, file, git, gist, and vscode.",
});

export default function (ctx: ChatGenerationContext) {
  const { defTool } = ctx;

  const dbg = host.logger("genaiscript:resources");

  defTool(
    "resource_list",
    "List available resources from the host. Returns a list of available resource URIs and their descriptions.",
    {
      type: "object",
      properties: {},
    },
    async (args) => {
      const { context } = args;

      dbg(`listing available resources`);

      try {
        const resources = await host.resources();

        if (!resources || resources.length === 0) {
          return "No resources available from host. You can still use builtin protocols like https://, file://, git://, gist:// with the resource_read tool.";
        }

        dbg(`found ${resources.length} resources`);

        const results = resources
          .map((resource) => {
            const { uri, name, description, mimeType } = resource;
            let result = `uri: ${uri}`;
            if (name) result += `\nname: ${name}`;
            if (description) result += `\ndescription: ${description}`;
            if (mimeType) result += `\nmime: ${mimeType}`;
            return result;
          })
          .join("\n\n");

        context.log(`Found ${resources.length} resource(s)`);
        return results;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        dbg(`error listing resources: ${errorMsg}`);
        context.log(`Error listing resources: ${errorMsg}`);
        return `Error listing resources: ${errorMsg}`;
      }
    },
  );

  defTool(
    "resource_read",
    "Read the content of a resource from a URL. Resolves various protocols and returns the content of the files found at the URL.",
    {
      type: "object",
      properties: {
        url: {
          type: "string",
          description:
            "The URL to read the resource content from. Supports MCP resource resolution and various protocols including https, file, git, gist, and vscode.",
        },
      },
      required: ["url"],
    },
    async (args) => {
      const { context, url } = args;

      if (!url) {
        return "Error: URL is required";
      }

      dbg(`reading resource from URL: ${url}`);
      context.log(`Reading resource content from: ${url}`);

      try {
        const resource = await host.resolveResource(url);

        if (!resource) {
          dbg(`failed to resolve resource: ${url}`);
          return `Error: Unable to resolve resource from URL: ${url}`;
        }

        const { uri, files } = resource;
        dbg(`resolved ${files.length} files from ${uri.href}`);

        if (!files || files.length === 0) {
          return `Error: No files found at URL: ${url}`;
        }

        // Return content of all files found
        const results = files
          .map((file) => {
            if (!file.content) {
              return `File: ${file.filename} (no content available)`;
            }

            const header = `File: ${file.filename}${file.type ? ` (${file.type})` : ""}`;
            const separator = "```";

            if (file.encoding === "base64") {
              return `${header}\n${separator}\n[Base64 encoded content - ${file.content.length} characters]\n${separator}`;
            }

            return `${header}\n${separator}\n${file.content}\n${separator}`;
          })
          .join("\n\n");

        context.log(`Successfully read ${files.length} file(s) from resource`);
        return results;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        dbg(`error reading resource: ${errorMsg}`);
        context.log(`Error reading resource: ${errorMsg}`);
        return `Error reading resource from ${url}: ${errorMsg}`;
      }
    },
  );
}
