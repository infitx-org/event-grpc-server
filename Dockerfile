# Arguments
ARG NODE_VERSION=lts-alpine

# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine" \
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t infitx-org/event-grpc-server:local \
#    . \
#

# Build Image
FROM node:${NODE_VERSION} as builder

WORKDIR /opt/app

RUN apk --no-cache add git
RUN apk add --no-cache -t build-dependencies make gcc g++ python3 libtool openssl-dev autoconf automake bash \
    && cd $(npm root -g)/npm

COPY package.json package-lock.json* /opt/app/

RUN npm ci --omit=dev

FROM node:${NODE_VERSION}
WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D ml-user 

# Copy over filesfrom builder
COPY --chown=ml-user --from=builder /opt/app .

# Set non-root user
USER ml-user

# Copy actual code
COPY config /opt/app/config
COPY src /opt/app/src

EXPOSE 4001
CMD ["npm", "run", "start"]
