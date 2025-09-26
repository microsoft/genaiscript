Interactive command to configure and validate the LLM connections.

## LLMs

The `configure llm` action allows you to configure and validate the LLM connections. This is useful for ensuring that your application can communicate with the LLMs you intend to use.

```bash
genaiscript configure llm
```

## GitHub Action

The `configure action` generates the scaffolding of files to publish a script as a [custom containerized GitHub Action](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action).

```bash
genaiscript configure action <my-script-id>
```

Most of the action metadata is mined from the script itself, so you only need to provide the name of the script. It exports the generated files under `.genaiscript/action/<script-id>` by default, but you can override this when updating an existing action project.