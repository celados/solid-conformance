import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const revision = '2172a37687e92dd91758476423f08cb4a12bcb0c'
const pluginRevision = 'ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0'
const packages = [['solid-js', 'solid'], ['@solidjs/web', 'web'], ['@solidjs/signals', 'signals'], ['@solidjs/compiler', 'compiler'], ['@solidjs/babel-plugin', 'babel-plugin']] as const
const selected = ['solid-js@2.0.0-rc.15', '@solidjs/web@2.0.0-rc.15', '@solidjs/signals@2.0.0-rc.15', '@solidjs/compiler@2.0.0-rc.15', '@solidjs/babel-plugin@2.0.0-rc.15', '@solidjs/vite-plugin@3.0.0-next.50', 'vite@8.3.3']

async function command(args: string[], cwd: string) {
  const child = Bun.spawn(args, { cwd, stdout: 'pipe', stderr: 'pipe' })
  const stdout = new Response(child.stdout).text(), stderr = new Response(child.stderr).text()
  const code = await child.exited
  if (code !== 0) throw new Error(`${args.join(' ')} exited ${code}: ${await stdout}\n${await stderr}`)
}

export async function prepareFixture(target: string) {
  if (!['rc15', 'head'].includes(target)) throw new Error(`Unknown PREBUNDLE_TARGET: ${target}`)
  const directory = resolve(import.meta.dirname, '.scratch', target)
  await mkdir(resolve(directory, 'src'), { recursive: true })
  const overrides: Record<string, string> = Object.fromEntries(packages.map(([name]) => [name, '2.0.0-rc.15']))
  if (target === 'head') {
    const frozen = resolve(import.meta.dirname, '.scratch/upstream', revision, 'packages')
    if (!(await Bun.file(resolve(frozen, 'signals/package.json')).exists())) {
      const source = process.env.PREBUNDLE_HEAD_PACKAGES
      if (!source) throw new Error(`Frozen HEAD ${revision} is absent. Set PREBUNDLE_HEAD_PACKAGES to that pristine built snapshot's packages directory; root package links are never changed.`)
      for (const [, folder] of packages) await cp(resolve(source, folder), resolve(frozen, folder), { recursive: true, filter: path => !path.split('/').some(part => ['node_modules', 'src', 'tests', 'target'].includes(part)) })
    }
    for (const [name, folder] of packages) overrides[name] = `file:${resolve(frozen, folder)}`
    const compilerPath = resolve(frozen, 'compiler/package.json')
    const compiler = JSON.parse(await readFile(compilerPath, 'utf8'))
    if (!compiler.files.includes('*.node')) { compiler.files.push('*.node'); await writeFile(compilerPath, JSON.stringify(compiler, null, 2)) }
  }
  const stamp = JSON.stringify({ target, revision: target === 'head' ? revision : '2.0.0-rc.15', overrides, selected })
  const marker = resolve(directory, '.installed.json')
  if (!(await Bun.file(marker).exists()) || await Bun.file(marker).text() !== stamp) {
    await writeFile(resolve(directory, 'package.json'), JSON.stringify({ name: `finding060-${target}`, private: true, type: 'module', overrides }, null, 2))
    await command(['bun', 'add', '--exact', ...selected], directory)
    await writeFile(marker, stamp)
  }
  if (target === 'head') {
    const source = process.env.PREBUNDLE_PLUGIN_SOURCE ?? resolve(import.meta.dirname, '.scratch/plugin-source')
    if (!(await Bun.file(resolve(source, 'src/index.ts')).exists())) throw new Error(`Plugin source ${pluginRevision} is absent; set PREBUNDLE_PLUGIN_SOURCE to that source snapshot.`)
    const destination = resolve(directory, 'node_modules/@solidjs/vite-plugin-head')
    await mkdir(destination, { recursive: true })
    const manifest = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'))
    await writeFile(resolve(destination, 'package.json'), JSON.stringify({ ...manifest, name: '@solidjs/vite-plugin-head' }, null, 2))
    await command(['bun', 'build', './src/index.ts', '--target=node', '--packages=external', '--outfile', resolve(destination, 'dist/esm/index.mjs')], source)
  }
  for (const name of ['App.tsx', 'server.tsx', 'client-probe.ts']) await cp(resolve(import.meta.dirname, name), resolve(directory, 'src', name))
  await cp(resolve(import.meta.dirname, 'fixture-vite.config.mjs'), resolve(directory, 'fixture-vite.config.mjs'))
  return { target, runtime: target === 'head' ? revision : '2.0.0-rc.15', plugin: target === 'head' ? pluginRevision : '3.0.0-next.50', vite: '8.3.3', directory }
}
