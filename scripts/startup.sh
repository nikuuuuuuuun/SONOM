#!/usr/bin/env bash
# SONOM hybrid runtime: Redis + Medusa + Cloudflare Tunnel.
set -euo pipefail

cd "$(dirname "$0")/.."
exec node scripts/hybrid.mjs "$@"
