import { expect, test } from 'bun:test'
import { prepareFixture } from './setup'

test('excluded web package still shares the configured server-function client with frames', async () => {
  const target = process.env.PREBUNDLE_TARGET ?? 'rc15'
  const receipt = await prepareFixture(target)
  const child = Bun.spawn(['bun', new URL('./run.ts', import.meta.url).pathname], { cwd: process.cwd(), env: { ...process.env, PREBUNDLE_TARGET: target }, stdout: 'pipe', stderr: 'pipe' })
  const output = new Response(child.stdout).text(), errors = new Response(child.stderr).text()
  const code = await child.exited
  const stdout = await output
  if (code !== 0) throw new Error(`Isolated Vite fixture exited ${code}: ${stdout}\n${await errors}`)
  const result = JSON.parse(stdout.trim().split('\n').at(-1)!)
  console.log(JSON.stringify({ receipt, result }))
  // These are desired-behavior assertions. PREBUNDLE_CLIENT=1 changes only
  // optimizer configuration, keeping this same assertion as the removal gate.
  expect(result).toMatchObject({ before: { sameConfigure: true }, after: { settled: true, value: 'function' }, panelCount: 1, panelText: ['Server panel'], pageErrors: [], rpc: [{ status: 200, contentType: 'application/x-frame-stream' }] })
}, 90000)
