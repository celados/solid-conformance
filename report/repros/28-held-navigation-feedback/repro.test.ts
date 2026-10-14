import { test, expect } from 'bun:test'
import { chromium } from 'playwright'
import { rm } from 'node:fs/promises'
import { build } from './build'

test('held navigation publishes delayed feedback before committing its route', async () => {
  await build({client: ['client.tsx'], server: []})
  const server = Bun.serve({hostname: '127.0.0.1', port: 0, fetch(request) {
    const path = new URL(request.url).pathname
    return path.endsWith('.js')
      ? new Response(Bun.file('.build' + path), {headers: {'content-type': 'text/javascript'}})
      : new Response('<!doctype html><div id="root"></div><script type="module" src="/client.js"></script>', {headers: {'content-type': 'text/html'}})
  }})
  try {
    const browser = await chromium.launch({channel: 'chrome', headless: true})
    try {
      const page = await browser.newPage(), messages: string[] = []
      page.on('pageerror', error => messages.push(error.message))
      page.on('console', message => {if (['error', 'warning'].includes(message.type())) messages.push(message.text())})
      await page.goto(String(server.url))
      await page.getByRole('button').click()
      await page.waitForTimeout(400)
      const before = {status: await page.getByRole('status').count(), text: await page.locator('p').textContent(), url: await page.evaluate(() => window.navigationURL())}
      await page.evaluate(() => window.releaseNavigation())
      await page.getByText('new', {exact: true}).waitFor()
      console.log(JSON.stringify({before, after: {status: await page.getByRole('status').count(), url: await page.evaluate(() => window.navigationURL())}, messages}))
      expect(messages).toEqual([])
      expect(await page.getByRole('status').count()).toBe(0)
      expect(await page.evaluate(() => window.navigationURL())).toBe('/slow')
      expect(before).toEqual({status: 1, text: 'old', url: '/'})
    } finally {await browser.close()}
  } finally {server.stop(true); await rm('.build', {recursive: true, force: true})}
}, 60000)
