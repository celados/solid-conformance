import { test, expect, beforeAll, afterAll } from 'bun:test'
import { rm } from 'node:fs/promises'
import { build } from './build'

beforeAll(async () => {await build({client: ['untrack.ts', 'pinned.ts'], server: []})})
afterAll(async () => {await rm('.build', {recursive: true, force: true})})

test('untrack permits writes as the documentation suggests', async () => {
  const runtime = await import('./.build/' + 'untrack.js') as typeof import('./untrack')
  expect(runtime.ownedWriteControl).not.toThrow()
  expect(runtime.untrackWrite).not.toThrow()
})

test('documented pinned derivation retakes its source on same-tick unpin', async () => {
  const runtime = await import('./.build/' + 'pinned.js') as typeof import('./pinned')
  expect(runtime.pinnedDerivation(true)).toEqual({n: 3, pinned: false})
  const result = runtime.pinnedDerivation()
  console.log(JSON.stringify({pinned: result}))
  expect(result).toEqual({n: 3, pinned: false})
})

async function typecheck(file: string) {
  const config = '.build/' + file + '.json'
  await Bun.write(config, JSON.stringify({compilerOptions: {target: 'ESNext', module: 'Preserve', moduleResolution: 'bundler', strict: true, noEmit: true, skipLibCheck: true, lib: ['ESNext'], types: []}, files: ['../fixtures/' + file + '.ts']}))
  const child = Bun.spawn([process.execPath, 'x', '--no-install', 'tsc', '-p', config], {stdout: 'pipe', stderr: 'pipe'})
  const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
  const result = {file, exitCode: await child.exited, output: stdout + stderr}
  console.log(JSON.stringify(result))
  return result
}

for (const file of ['effect-error', 'store-path', 'migration']) {
  test('documented ' + file + ' example typechecks', async () => {
    expect((await typecheck('corrections')).exitCode).toBe(0)
    expect((await typecheck(file)).exitCode).toBe(0)
  }, 30000)
}
