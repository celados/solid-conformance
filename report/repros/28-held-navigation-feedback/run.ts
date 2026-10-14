import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const target = process.argv[2] ?? 'rc15'
if (!['rc15', 'next'].includes(target)) throw new Error('Usage: bun run run.ts [rc15|next]')
const source = dirname(import.meta.path)
const host = await mkdtemp(join(tmpdir(), 'solid-standalone-repro-'))
async function run(command: string[]) {
  const child = Bun.spawn(command, {cwd: host, stdout: 'inherit', stderr: 'inherit'})
  console.log('Started PID ' + child.pid + ': ' + command.join(' '))
  return await child.exited
}
try {
  for (const file of await Array.fromAsync(new Bun.Glob('**/*').scan({cwd: source, dot: true, onlyFiles: true}))) {
    if (file.startsWith('node_modules/') || file.startsWith('.build/')) continue
    await Bun.write(join(host, file), Bun.file(join(source, file)))
  }
  if (await run([process.execPath, 'install', '--frozen-lockfile'])) throw new Error('Installation failed')
  if (target === 'next' && await run([process.execPath, 'run', 'next'])) throw new Error('Installing next packages failed')
  console.log('Target: ' + target + '; build: ' + (process.env.BUILD_MODE ?? 'development'))
  process.exitCode = await run([process.execPath, 'run', 'repro'])
} finally {
  await rm(host, {recursive: true, force: true})
}
