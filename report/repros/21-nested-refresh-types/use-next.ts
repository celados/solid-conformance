import { spawn } from "bun"
const packages = ["solid-js","@solidjs/signals","@solidjs/web","@solidjs/diagnostics"]
const child = spawn([process.execPath, 'add', '--exact', ...packages.map(name => name + '@next')], {stdout: 'inherit', stderr: 'inherit'})
process.exitCode = await child.exited
