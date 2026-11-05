/**
 * Small helpers used by /info.
 * Keeping logic here makes unit tests simple and fast.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json once at startup instead of on every /info request
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8')
)

export function getPackageInfo () {
  return { name: pkg.name, version: pkg.version }
}

export function getRuntimeInfo () {
  return { node: process.version, uptime: process.uptime() }
}
