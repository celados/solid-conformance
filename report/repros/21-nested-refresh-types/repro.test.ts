import { test, expect } from 'bun:test'
import { rm } from 'node:fs/promises'

test('documented nested derived-store refresh typechecks', async () => {
  const config = {compilerOptions: {target: 'ESNext', module: 'Preserve', moduleResolution: 'bundler', strict: true, noEmit: true, skipLibCheck: true, lib: ['ESNext'], types: []}}
  try {
    await Bun.write('.build/control.ts', "import { createStore, refresh } from 'solid-js'\nconst [store] = createStore(() => ({ row: { n: 1 } }), { row: { n: 0 } })\nvoid refresh(store)\n")
    for (const file of ['.build/control.ts', 'usage.ts']) {
      await Bun.write('.build/check.json', JSON.stringify({...config, files: ['../' + file]}))
      const child = Bun.spawn([process.execPath, 'x', '--no-install', 'tsc', '-p', '.build/check.json'], {stdout: 'pipe', stderr: 'pipe'})
      const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
      const result = {file, exitCode: await child.exited, output: stdout + stderr}
      console.log(JSON.stringify(result))
      expect(result.exitCode).toBe(0)
    }
  } finally {await rm('.build', {recursive: true, force: true})}
}, 30000)
