Launch a local web server that is used to run the playground
or Visual Studio Code.

Run from the workspace root:

```bash
npx genaiscript serve
```

## port

The default port is `8003`. You can specify the port by setting the `--port` flag.

```bash
npx genaiscript serve --port 8004
```

## API key

The API key is used to authenticate the requests to the server.
You can specify an API key by setting the `--api-key` flag or the `GENAISCRIPT_API_KEY` environment variable.

```bash
npx genaiscript serve --api-key my-api-key
```

or

```txt title=".env"
GENAISCRIPT_API_KEY=my-api-key
```

The API key can be set in the `Authorization` header of a request or in the URL query parameter `api-key` (`http://localhost:8003/#api-key=my-api-key`)

## CORS

You can enable [Cross Origin Shared Resource](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) by setting the `--cors` flag or setting the `GENAISCRIPT_CORS_ORIGIN` environment variable.

```bash
npx genaiscript serve --cors contoso.com
```

## Network

You can bind the server to `0.0.0.0` and make it accessible from the network by setting the `--network` flag. You need this flag to make the server accessible from a container.

```bash
npx genaiscript serve --network
```

We highly recommend setting the API key when running the server on the network.

## Dockerized

To run a minimal docker image with the server, you can use the following command:

```sh
docker run --name genaiscript --rm -it --expose 8003 -p 8003:8003 -v ${PWD}:/workspace -w /workspace node:alpine npx --yes genaiscript serve --network
```

then open `http://localhost:8003` in your browser.

## OpenAI API endpoints

The server implements various OpenAI API compatible endpoints. You can use the server as a proxy to the OpenAI API by setting the `--openai` flag.
The routes can be used to provide a stable access to the configured LLMs to other tools like promptfoo.

```bash
npx genaiscript serve --openai
```

This will enable the following routes:

### `/v1/chat/completions`

Mostly compatible with OpenAI's chat completions API. The server will forward the requests to the OpenAI API and return the response.

- `stream` is not supported.

### `/v1/models`

Returns the list of models and aliases available in the server.