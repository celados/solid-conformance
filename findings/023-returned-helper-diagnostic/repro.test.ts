import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
import { build } from '../../scripts/build'

test('08:L359:2 helper returned without await is excluded from async-read warnings', async () => {
  const dir = resolve('.build', 'returned-helper-' + process.pid)
  const mode = (process.env.BUILD_MODE ?? 'development') as 'development' | 'production'
  await build(dir, mode, { client: ['findings/023-returned-helper-diagnostic/client.ts'], server: [] })
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
    expect(result.direct).toEqual({ value: 1, warnings: mode === 'development' ? 1 : 0 })
    expect(result.helper).toEqual({ value: 1, warnings: 0 })
  } finally {
    await browser.close()
    server.stop(true)
    await rm(dir, { recursive: true, force: true })
  }
}, 30000)
