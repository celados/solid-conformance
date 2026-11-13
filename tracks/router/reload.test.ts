import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

import { build } from '../../scripts/build'
// 10-server-functions.md code C90 / reload: no value, refetch all keys when omitted.
test('router reload omitted keys revalidate both consumers; explicit [] retains both', async () => {
	const dir = resolve('.build', 'reload-' + process.pid)
	await build(dir, (process.env.BUILD_MODE ?? 'development') as any, {
		client: ['tracks/router/reload-client.tsx'],
		server: [],
	})
	const server = Bun.serve({
		port: 0,
		fetch: (r) =>
			new URL(r.url).pathname === '/reload-client.js'
				? new Response(Bun.file(dir + '/reload-client.js'), {
						headers: { 'content-type': 'text/javascript' },
					})
				: new Response(
						'<script type="module" src="/reload-client.js"></script>',
						{ headers: { 'content-type': 'text/html' } },
					),
	})
	const browser = await chromium.launch({ channel: 'chrome', headless: true })
	try {
		const page = await browser.newPage()
		await page.goto(server.url.toString())
		await page.waitForFunction(() => !!(window as any).result)
		const result = await page.evaluate(() => (window as any).result)
		expect(result).toEqual({
			all: { initial: '0:0', final: '1:1', calls: [2, 2] },
			none: { initial: '0:0', final: '0:0', calls: [1, 1] },
		})
	} finally {
		await browser.close()
		await server.stop(true)
		await rm(dir, { recursive: true, force: true })
	}
}, 30000)
