# SONOM hybrid runtime: Redis + Medusa + Cloudflare Tunnel.
$ErrorActionPreference = 'Stop'

Push-Location (Join-Path $PSScriptRoot '..')
try {
  node scripts/hybrid.mjs @args
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
