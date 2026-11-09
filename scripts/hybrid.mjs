#!/usr/bin/env node
/**
 * SONOM hybrid runtime.
 *
 * Boots, in this order:
 *   1. Redis (Docker) when apps/backend/.env has no REDIS_URL
 *   2. Medusa backend (`pnpm --filter @sonom/backend dev`)
 *   3. Cloudflare Tunnel (`cloudflared tunnel run <name>`)
 *
 * The storefront runs on Vercel and reaches the backend through the tunnel.
 * Every child is tracked and torn down on Ctrl+C / SIGTERM.
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BACKEND_DIR = join(ROOT, 'apps', 'backend')
const BACKEND_ENV = join(BACKEND_DIR, '.env')

const BACKEND_PORT = Number(process.env.PORT || 9000)
const BACKEND_HEALTH = `http://127.0.0.1:${BACKEND_PORT}/health`
const TUNNEL_NAME = process.env.CLOUDFLARE_TUNNEL_NAME || 'sonom-api'
const TUNNEL_DISABLED = process.env.CLOUDFLARED_DISABLE === 'true'
const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'sonom-redis'
const REDIS_PORT = process.env.REDIS_PORT || '6379'
const HEALTH_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS || 180_000)
const isWindows = process.platform === 'win32'

const children = new Set()
let shuttingDown = false

function log(scope, message) {
  const stamp = new Date().toISOString().slice(11, 19)
  console.log(`[${stamp}] [${scope}] ${message}`)
}

function warn(scope, message) {
  const stamp = new Date().toISOString().slice(11, 19)
  console.warn(`[${stamp}] [${scope}] ${message}`)
}

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {}
  }

  const result = {}
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const index = line.indexOf('=')
    if (index === -1) continue

    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function hasCommand(command) {
  const probe = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: false,
  })
  return probe.status === 0
}

function runSync(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'ignore',
    ...options,
  })
}

function hasDockerDaemon() {
  return runSync('docker', ['info']).status === 0
}

function startProcess(scope, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    // Node 24 refuses to execute .cmd shims directly on Windows.
    shell: isWindows,
    ...options,
  })

  children.add(child)

  child.on('error', (error) => {
    warn(scope, `failed to start: ${error.message}`)
  })

  child.on('exit', (code, signal) => {
    children.delete(child)
    if (!shuttingDown && code !== 0 && code !== null) {
      warn(scope, `exited with code ${code}${signal ? ` (${signal})` : ''}`)
    }
  })

  return child
}

function killTree(child, signal = 'SIGTERM') {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return
  }

  if (isWindows) {
    // A Windows shell spawns cmd.exe -> pnpm -> medusa -> node. SIGTERM does
    // not traverse that tree, so force-kill by PID.
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    })
    return
  }

  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // Already gone.
    }
  }
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  log('hybrid', 'shutting down…')

  for (const child of [...children]) {
    killTree(child)
  }

  // Give the backend a beat to release the port before exiting.
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 750))
  process.exit(exitCode)
}

function ensureRedis() {
  const env = readEnvFile(BACKEND_ENV)

  if (process.env.REDIS_URL || env.REDIS_URL) {
    log('redis', 'using REDIS_URL from environment')
    return process.env.REDIS_URL || env.REDIS_URL
  }

  if (!hasCommand('docker') || !hasDockerDaemon()) {
    warn(
      'redis',
      'Docker is not available (CLI missing or daemon stopped). Falling back to the in-memory event bus (webhook retries will not survive restarts).',
    )
    return ''
  }

  const inspected = runSync('docker', ['inspect', REDIS_CONTAINER])
  if (inspected.status !== 0) {
    log('redis', `creating container ${REDIS_CONTAINER}`)
    const created = spawnSync(
      'docker',
      [
        'run',
        '-d',
        '--name',
        REDIS_CONTAINER,
        '-p',
        `${REDIS_PORT}:6379`,
        '--restart',
        'unless-stopped',
        'redis:7-alpine',
      ],
      { stdio: 'inherit' },
    )

    if (created.status !== 0) {
      warn('redis', 'could not create the Redis container; continuing without it')
      return ''
    }
  } else {
    log('redis', `starting container ${REDIS_CONTAINER}`)
    const started = runSync('docker', ['start', REDIS_CONTAINER])
    if (started.status !== 0) {
      warn('redis', 'could not start the Redis container; continuing without it')
      return ''
    }
  }

  return `redis://127.0.0.1:${REDIS_PORT}`
}

async function waitForBackend() {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  let attempts = 0

  while (Date.now() < deadline) {
    attempts += 1
    try {
      const response = await fetch(BACKEND_HEALTH, {
        signal: AbortSignal.timeout(2_500),
      })
      if (response.ok) {
        log('backend', `healthy after ${attempts} attempt(s): ${BACKEND_HEALTH}`)
        return true
      }
    } catch {
      // Not listening yet.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000))
  }

  warn(
    'backend',
    `did not become healthy within ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s (${BACKEND_HEALTH})`,
  )
  return false
}

async function main() {
  if (!existsSync(BACKEND_ENV)) {
    warn('hybrid', `missing ${BACKEND_ENV}; copy apps/backend/.env.template first`)
  }

  process.on('SIGINT', () => void shutdown(130))
  process.on('SIGTERM', () => void shutdown(143))
  process.on('uncaughtException', (error) => {
    console.error(error)
    void shutdown(1)
  })

  const redisUrl = ensureRedis()

  const backendEnv = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: String(BACKEND_PORT),
  }
  if (redisUrl) {
    backendEnv.REDIS_URL = redisUrl
  }

  log('backend', `starting Medusa on :${BACKEND_PORT}`)
  startProcess(
    'backend',
    'pnpm',
    ['--filter', '@sonom/backend', 'dev'],
    {
      cwd: ROOT,
      env: backendEnv,
      detached: !isWindows,
    },
  )

  const healthy = await waitForBackend()

  if (TUNNEL_DISABLED) {
    log('tunnel', 'CLOUDFLARED_DISABLE=true, skipping cloudflared')
  } else if (!hasCommand('cloudflared')) {
    warn(
      'tunnel',
      'cloudflared not found in PATH. Install it and re-run, or set CLOUDFLARED_DISABLE=true.',
    )
  } else {
    if (!healthy) {
      warn('tunnel', 'starting cloudflared anyway; the backend is not healthy yet')
    }

    log('tunnel', `starting cloudflared tunnel ${TUNNEL_NAME}`)
    startProcess(
      'tunnel',
      'cloudflared',
      ['tunnel', 'run', TUNNEL_NAME],
      { cwd: ROOT, detached: !isWindows },
    )
  }

  log(
    'hybrid',
    `ready — backend ${BACKEND_HEALTH} | tunnel ${TUNNEL_DISABLED ? 'disabled' : TUNNEL_NAME}`,
  )
}

await main()
