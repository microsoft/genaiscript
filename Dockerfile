FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip
WORKDIR /app
COPY . /app
RUN yarn install && yarn compile
EXPOSE 8003
CMD ["node", "packages/cli/built/genaiscript.cjs", "serve"]