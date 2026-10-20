import { chromium } from 'playwright'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const target = process.env.PREBUNDLE_TARGET ?? 'rc15'
const patched = process.env.PREBUNDLE_CLIENT === '1'
const fixture = resolve(import.meta.dirname, '.scratch', target)
const port = Number(process.env.PROBE_PORT ?? (target === 'head' ? 54761 : 54760))
const origin = `http://127.0.0.1:${port}`
const versions = { runtime: target === 'head' ? '2172a37687e92dd91758476423f08cb4a12bcb0c' : '2.0.0-rc.15', plugin: target === 'head' ? 'ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0' : '3.0.0-next.50', vite: '8.3.3' }
await rm(resolve(fixture, 'node_modules/.vite'), { recursive: true, force: true })
const server = Bun.spawn(['bun', './node_modules/vite/bin/vite.js', '--config', 'fixture-vite.config.mjs'], {
  cwd: fixture,
  env: { ...process.env, PROBE_PORT: String(port) },
  stdout: 'pipe', stderr: 'pipe',
})
const output = new Response(server.stdout).text()
const errors = new Response(server.stderr).text()
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
let result: Record<string, unknown> | undefined
try {
  let ready = false, lastDocument = 'No HTTP response'
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness: ${await errors}`)
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(3000) })
      if (response.ok) { ready = true; break }
      lastDocument = `${response.status}: ${(await response.text()).slice(0, 500)}`
    } catch (error) { lastDocument = String(error) }
    await Bun.sleep(100)
  }
  if (!ready) throw new Error(`Vite did not serve a successful document: ${lastDocument}`)
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage()
  const pageErrors: string[] = []
  const rpc: Array<{ status: number; contentType: string }> = []
  const scripts: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname) })
  page.on('response', response => {
    if (response.url().includes('/_server/')) rpc.push({ status: response.status(), contentType: response.headers()['content-type'] ?? '' })
  })
  await page.goto(origin)
  try { await page.waitForFunction(() => globalThis.prebundleProbe?.ready, null, { timeout: 10000 }) }
  catch { throw new Error(`Client probe did not boot: ${JSON.stringify({ pageErrors, html: (await page.content()).slice(0, 500), scripts })}`) }
  const before = await page.evaluate(() => ({ ...globalThis.prebundleProbe }))
  await page.locator('#mount-panel').click()
  try { await page.waitForFunction(() => globalThis.prebundleProbe?.settled, null, { timeout: 10000 }) }
  catch { throw new Error(`Server component never settled: ${JSON.stringify({ pageErrors, rpc, probe: await page.evaluate(() => globalThis.prebundleProbe) })}`) }
  await page.waitForTimeout(100)
  result = { target, versions, patched, serverPid: server.pid, before, after: await page.evaluate(() => ({ ...globalThis.prebundleProbe })), panelCount: await page.locator('#server-panel').count(), panelText: await page.locator('#server-panel').allTextContents(), rpc, pageErrors, scripts }
} finally {
  await browser?.close()
  server.kill()
  await server.exited
  const log = { stdout: await output, stderr: await errors }
  const evidence = resolve(import.meta.dirname, '../../report/evidence')
  await mkdir(evidence, { recursive: true })
  await writeFile(resolve(evidence, `field-prebundle-${target}-${patched ? 'include-client' : 'unpatched'}.json`), JSON.stringify(result ?? { target, patched, fixtureFailure: log }, null, 2) + '\n')
  console.log(JSON.stringify(result ?? log))
}
