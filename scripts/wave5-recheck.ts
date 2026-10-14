import { mkdir } from 'node:fs/promises'
import { runtimeReceipt } from '../harness/runtime'

type Result = { id: string; path: string; mode: string; pid: number; exitCode: number; pass: number; fail: number; log: string }
const runtime = await runtimeReceipt()
const target = runtime.target
const directory = `report/evidence/wave5-rechecks/${target}`
await mkdir(directory, { recursive: true })
const paths = (await Array.fromAsync(new Bun.Glob('findings/**/*.test.ts').scan('.'))).sort()
const results: Result[] = []
// The installed package graph is immutable throughout one matrix invocation.
for (const mode of ['development', 'production']) {
 for (const path of paths) {
  const child = Bun.spawn([process.execPath, 'test', './' + path], {env: {...process.env, BUILD_MODE: mode}, stdout: 'pipe', stderr: 'pipe'})
  const pid = child.pid
  const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
  const output = stdout + stderr
  const id = path.split('/')[1]!.slice(0, 3)
  const log = `${directory}/${id}-${mode}-${path.split('/').at(-1)}.log`
  await Bun.write(log, output)
  const result = {id, path, mode, pid, exitCode, pass: Number(output.match(/^\s*(\d+) pass$/m)?.[1] ?? 0), fail: Number(output.match(/^\s*(\d+) fail$/m)?.[1] ?? 0), log}
  results.push(result)
  console.log(JSON.stringify(result))
  await Bun.write(`report/evidence/wave5-${target}-matrix.json`, JSON.stringify({runtime, findingCount: new Set(paths.map(p=>p.split('/')[1])).size, results}, null, 2)+'\n')
 }
}
