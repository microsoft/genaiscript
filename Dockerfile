# Build
FROM node:22-alpine as build

WORKDIR /app
COPY . /app

RUN apk update --no-cache && \
    apk add --no-cache python3 py3-pip && \
    echo "Installing && Compiling" && \
    pnpm install && pnpm build:cli


# Prod
FROM node:22-alpine

# Copy the necessary files from the build stage
COPY --from=build /app/packages/cli/built /app/packages/cli/built
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

EXPOSE 8003

CMD ["node", "/app/packages/cli/dist/src/index.js", "serve"]
