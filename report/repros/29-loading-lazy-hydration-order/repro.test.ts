import { test, expect } from 'bun:test'
import { chromium } from 'playwright'
import { rm } from 'node:fs/promises'
import { build } from './build'

test('Loading preserves static and lazy child order during hydration', async () => {
  await build({client: ['client.tsx', 'part.tsx'], server: ['server.tsx']})
  const ssr = await import('./.build/' + 'server.js') as typeof import('./server')
  const server = Bun.serve({hostname: '127.0.0.1', port: 0, fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith('.js')) return new Response(Bun.file('.build' + url.pathname), {headers: {'content-type': 'text/javascript'}})
    return url.searchParams.has('hydrate')
      ? new Response(ssr.stream().readable, {headers: {'content-type': 'text/html'}})
      : new Response('<!doctype html><div id="root"></div><script type="module" src="/client.js"></script>', {headers: {'content-type': 'text/html'}})
  }})
  try {
    const browser = await chromium.launch({channel: 'chrome', headless: true})
    try {
      const results = []
      for (const hydration of [false, true]) {
        const page = await browser.newPage(), messages: string[] = []
        page.on('pageerror', error => messages.push(error.message))
        page.on('console', message => {if (['warning', 'error'].includes(message.type())) messages.push(message.text())})
        try {
          await page.goto(String(server.url) + (hydration ? '?hydrate' : ''))
          await page.getByText('C', {exact: true}).waitFor()
          await page.waitForTimeout(50)
          results.push({hydration, order: await page.locator('#root span').allTextContents(), messages})
        } finally {await page.close()}
      }
      console.log(JSON.stringify(results))
      expect(results.map(result => result.messages)).toEqual([[], []])
      expect(results[0]!.order).toEqual(['A', 'B', 'C'])
      expect(results[1]!.order).toEqual(['A', 'B', 'C'])
    } finally {await browser.close()}
  } finally {server.stop(true); await rm('.build', {recursive: true, force: true})}
}, 60000)
