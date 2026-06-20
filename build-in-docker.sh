#!/usr/bin/env bash
#
# Build the client assets inside a Node 16 Docker container.
#
# Native deps (node-sass) don't install on arm Macs, so we build in Docker.
# Node 16 is the sweet spot: node-sass@9 needs node >=16, and webpack 1's
# md4 hashing still works (Node 17+ would need --openssl-legacy-provider).
#
# Output: client/build/main.bundle.js + index.html (a development build,
# matching `npm run build`). The directory is gitignored.
#
# Usage: ./build-in-docker.sh

set -euo pipefail

cd "$(dirname "$0")"

docker run --rm \
  -v "$PWD":/app \
  -v /app/node_modules \
  -w /app \
  node:16 \
  bash -lc '
    set -e
    # Install without lifecycle scripts: skips the project postinstall
    # (git-clones rails-i18n + builds; not needed, pluralization-keys.json
    # already exists) and avoids the strict peer-dep conflict from
    # expose-loader (wants webpack 2/3 while the project pins webpack 1).
    npm ci --no-audit --no-fund --ignore-scripts --legacy-peer-deps \
      || npm install --no-audit --no-fund --ignore-scripts --legacy-peer-deps

    # --ignore-scripts also skipped node-sass building its native binary,
    # so build it explicitly for this (linux) container.
    npm rebuild node-sass

    npm run build
  '

echo
echo "Done. Built assets:"
ls -la client/build
