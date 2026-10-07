import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
import { build } from '../../scripts/build'

test('08:L419:3 async landing labels HUGE_FAN_OUT data.write as async', async () => {
  const dir = resolve('.build', 'async-fanout-' + process.pid)
  const mode=(process.env.BUILD_MODE??'development') as 'development'|'observe'|'production'
  await build(dir, mode, { client: ['findings/025-async-fanout-classification/client.ts'], server: [] })
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
    expect(result.value).toBe(1)
    if(mode==='production'){expect(result.causes).toEqual([]);expect(result.warnings).toEqual([])}
    else {expect(result.causes).toContain('async');expect(result.warnings).toEqual(['async'])}
  } finally {
    await browser.close()
    server.stop(true)
    await rm(dir, { recursive: true, force: true })
  }
}, 30000)
