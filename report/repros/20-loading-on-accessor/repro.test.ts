import { test, expect } from 'bun:test'
import { chromium } from 'playwright'
import { rm } from 'node:fs/promises'
import { build } from './build'

test('Loading on accessor rearms fallback like its value-form control', async () => {
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
      const outcomes = []
      for (const control of [true, false]) {
        const page = await browser.newPage(), messages: string[] = []
        page.on('pageerror', error => messages.push(error.message))
        page.on('console', message => {if (['error', 'warning'].includes(message.type())) messages.push(message.text())})
        try {
          await page.goto(String(server.url) + (control ? '?control' : ''))
          await page.getByRole('button', {name: 'Resolve first'}).click()
          await page.getByText('1', {exact: true}).waitFor()
          await page.getByRole('button', {name: 'Replace', exact: true}).click()
          await page.waitForTimeout(100)
          outcomes.push({control, text: await page.locator('#root').innerText(), messages})
        } finally {await page.close()}
      }
      console.log(JSON.stringify(outcomes))
      expect(outcomes.map(outcome => outcome.messages)).toEqual([[], []])
      expect(outcomes[0]!.text).toContain('pending')
      expect(outcomes[1]!.text).toContain('pending')
    } finally {await browser.close()}
  } finally {server.stop(true); await rm('.build', {recursive: true, force: true})}
}, 60000)
