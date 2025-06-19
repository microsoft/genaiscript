# For additional guidance on containerized actions, see https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action
FROM node:lts-alpine

# Install packages
RUN apk add --no-cache git python3 py3-pip ffmpeg

# Set working directory
WORKDIR /genaiscript/action

# Copy source code
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile


# GitHub Action forces the WORKDIR to GITHUB_WORKSPACE 
ENTRYPOINT ["npm", "--prefix", "/genaiscript/action", "start"]