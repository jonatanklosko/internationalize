#!/usr/bin/env bash
#
# Run the whole app (Node server + MongoDB) in a SINGLE Docker container,
# with the app port bound to the host, just for local testing.
#
# Why a custom image: the server needs Node 16 AND MongoDB together, and
# mongoose 5.10 bundles the MongoDB 3.6 driver which refuses to talk to
# MongoDB >= 5.0 ("requires at most wire version 9 / MongoDB 4.4"). So we
# pin mongo:4.4 (which has a native arm64 image) and copy Node 16 into it
# from the official node:16 image (both are glibc 2.31, so it's compatible).
#
# The development config (server/config/environments/development.js) already
# points at mongodb://localhost:27017 and PORT 3000, so nothing needs to be
# overridden — mongod and the server share localhost inside the container.
#
# Usage:
#   ./build-in-docker.sh      # build client assets first (the server serves them)
#   ./run-in-docker.sh        # then start the server + db
#   open http://localhost:3000
#
# Data persists in the "internationalize-mongo" volume across runs; deps are
# cached in the "internationalize-node_modules" volume. Ctrl-C stops it.

set -euo pipefail
cd "$(dirname "$0")"

IMAGE=internationalize-dev
PORT=3000

# The server serves client/build via express.static — make sure it exists.
if [ ! -f client/build/main.bundle.js ]; then
  echo "client/build/main.bundle.js not found — run ./build-in-docker.sh first." >&2
  exit 1
fi

# Build the combined MongoDB 4.4 + Node 16 image (cached after the first run).
# `docker build -` uses an empty build context (the Dockerfile comes from stdin),
# so the repo / node_modules are not uploaded to the daemon.
docker build -t "$IMAGE" - <<'DOCKERFILE'
FROM node:16 AS node
FROM mongo:4.4
# node:16 is Debian bullseye, mongo:4.4 is Ubuntu focal; both ship glibc 2.31,
# so the Node binary from the official image runs as-is here.
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && node --version && npm --version
DOCKERFILE

echo
echo "Starting MongoDB + server. Open http://localhost:${PORT}  (Ctrl-C to stop)"
echo

exec docker run --rm -it \
  -p "${PORT}:3000" \
  -v "$PWD":/app \
  -v internationalize-node_modules:/app/node_modules \
  -v internationalize-mongo:/data/db \
  -w /app \
  "$IMAGE" \
  bash -lc '
    set -e
    # Start MongoDB in the background (ready to accept connections once --fork returns).
    mkdir -p /data/db
    mongod --dbpath /data/db --bind_ip 127.0.0.1 --logpath /tmp/mongod.log --fork >/dev/null

    # Install server runtime deps once; cached in the node_modules volume.
    # --ignore-scripts skips the postinstall git-clone+build; --legacy-peer-deps
    # works around expose-loader (wants webpack 2/3 while the project pins webpack 1).
    if [ ! -d node_modules/express ]; then
      npm ci --no-audit --no-fund --ignore-scripts --legacy-peer-deps
    fi

    # Run the server (development config -> localhost:27017, port 3000).
    exec node server/server.js
  '
