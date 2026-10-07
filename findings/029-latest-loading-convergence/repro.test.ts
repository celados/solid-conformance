import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
import { build } from '../../scripts/build'

test('Loading on latest(id) converges after its shared source lands', async () => {
  const mode = (process.env.BUILD_MODE ?? 'development') as 'development' | 'production'
  const dir = resolve('.build', 'latest-loading-' + process.pid)
  await build(dir, mode, { client: ['findings/029-latest-loading-convergence/client.tsx'], server: [] })
  const server = Bun.serve({ port: 0, fetch: request => new URL(request.url).pathname === '/client.js'
    ? new Response(Bun.file(dir + '/client.js'), { headers: { 'content-type': 'text/javascript' } })
    : new Response('<script type="module" src="/client.js"></script>', { headers: { 'content-type': 'text/html' } }) })
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(server.url.toString())
    await page.waitForFunction(() => !!(window as any).result)
    const result = await page.evaluate(() => (window as any).result)
    console.log(result)
    expect(result.normal.final).toBe('22')
    expect(result.latest.initial).toBe('11')
    expect(result.latest.waiting).toBe('A1')
    expect(result.latest.source).toBe(2)
    expect(result.latest.final).toBe('22')
  } finally {
    await browser.close()
    server.stop(true)
    await rm(dir, { recursive: true, force: true })
  }
}, 30000)
