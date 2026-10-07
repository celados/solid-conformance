import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, type Browser } from 'playwright'

import type {} from './client-api'
import type { Spec } from './tree'

import { build } from '../scripts/build'
let buildId = 0
export async function openHarness() {
	const directory = resolve('.build', `browser-${process.pid}-${buildId++}`)
	await build(directory)
	const ssr = (await import(
		resolve(directory, 'server.js')
	)) as typeof import('./server')
	const specs = new Map<string, Spec>()
	const serverStats = new Map<string, { opened: number; closed: number }[]>()
	const serverErrors = new Map<string, string[]>()
	const pending = new Map<string, () => Promise<void>>()
	const releases = new Map<string, Promise<void>>()
	const chunks = new Map<string, { at: number; bytes: number }[]>()
	const server = Bun.serve({
		port: 0,
		idleTimeout: 30,
		hostname: '127.0.0.1',
		async fetch(request) {
			const url = new URL(request.url)
			if (/^\/[a-zA-Z0-9_-]+\.js$/.test(url.pathname))
				return new Response(Bun.file(directory + url.pathname), {
					headers: { 'content-type': 'text/javascript' },
				})
			if (url.pathname === '/settle') {
				const key = url.searchParams.get('id')!
				if (
					(specs.get(key)?.scenario?.startsWith('live:') ||
						specs.get(key)?.scenario === 'minimal-store') &&
					!url.searchParams.get('boot')
				)
					return new Response('waiting for hydration')
				if (!releases.has(key) && pending.has(key))
					releases.set(key, pending.get(key)!())
				await releases.get(key)
				return new Response('settled')
			}
			if (url.pathname === '/favicon.ico')
				return new Response(null, { status: 204 })
			const spec = specs.get(url.searchParams.get('id')!)!
			const mode = url.searchParams.get('mode')
			const prefix = `<!doctype html><html><head>${ssr.generateHydrationScript()}</head><body><script>window.spec=${JSON.stringify(spec).replaceAll('<', '\\u003c')};window.mode=${JSON.stringify(mode)}</script><div id="root">`
			if (mode !== 'hydrate')
				return new Response(
					prefix +
						'</div><script type="module" async src="/client.js"></script></body></html>',
					{ headers: { 'content-type': 'text/html' } },
				)
			const run = ssr.stream(spec, request.signal)
			const streamStart = performance.now()
			const chunkTimes: { at: number; bytes: number }[] = []
			chunks.set(url.searchParams.get('id')!, chunkTimes)
			serverErrors.set(url.searchParams.get('id')!, run.errors)
			serverStats.set(
				url.searchParams.get('id')!,
				run.streams.map((s) => s.stats),
			)
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						new TextEncoder().encode(
							prefix +
								`<script>fetch('/settle?id=${url.searchParams.get('id')}')</script>`,
						),
					)
					let first = true
					run.output.pipe({
						write(chunk: string) {
							chunkTimes.push({
								at: performance.now() - streamStart,
								bytes: new TextEncoder().encode(chunk).byteLength,
							})
							controller.enqueue(new TextEncoder().encode(chunk))
							if (first) {
								first = false
								controller.enqueue(
									new TextEncoder().encode(
										'</div><script type="module" async src="/client.js"></script>',
									),
								)
							}
						},
						end() {
							controller.enqueue(new TextEncoder().encode('</body></html>'))
							controller.close()
						},
					})
					pending.set(url.searchParams.get('id')!, run.settle)
				},
			})
			return new Response(stream, { headers: { 'content-type': 'text/html' } })
		},
	})
	let browser: Browser
	try {
		browser = await chromium.launch({ channel: 'chrome', headless: true })
	} catch (e) {
		server.stop(true)
		throw e
	}
	let id = 0
	return {
		ssr,
		async run(spec: Spec, mode: 'csr' | 'hydrate') {
			const key = String(id++)
			specs.set(key, spec)
			const page = await browser.newPage()
			page.setDefaultTimeout(10000)
			const deadline = setTimeout(() => {
				void page.close()
			}, 15000)
			const messages: string[] = []
			const started = performance.now()
			page.on('console', (msg) => {
				if (['warning', 'error'].includes(msg.type()))
					messages.push(`${msg.type()}: ${msg.text()}`)
			})
			page.on('pageerror', (error) =>
				messages.push(`pageerror: ${error.message}`),
			)
			try {
				await page.goto(`${server.url}?id=${key}&mode=${mode}`, {
					waitUntil: 'commit',
					timeout: 15000,
				})
				await page.waitForFunction(() => !!window.harness, { timeout: 10000 })
				await page.evaluate(async () => {
					const id = new URL(location.href).searchParams.get('id')
					await Promise.all([
						fetch(`/settle?boot=1&id=${id}`),
						window.harness.settle(),
					])
				})
				await page.waitForLoadState('load', { timeout: 10000 })
				await page.evaluate(
					() => new Promise((resolve) => setTimeout(resolve, 30)),
				)
				const events = await page.evaluate(() => window.harness.events)
				const dom = await page.evaluate(() => window.harness.dom())
				const stats = await page.evaluate(() => window.harness.unmount())
				return {
					dom,
					events,
					serverChunks: chunks.get(key) ?? [],
					messages,
					stats,
					serverStats: serverStats.get(key) ?? [],
					serverErrors: serverErrors.get(key) ?? [],
					milliseconds: performance.now() - started,
				}
			} catch (error) {
				throw new Error(`${error}\n${messages.join('\n')}`)
			} finally {
				clearTimeout(deadline)
				await page.close()
				specs.delete(key)
				serverErrors.delete(key)
				serverStats.delete(key)
				pending.delete(key)
				releases.delete(key)
				chunks.delete(key)
			}
		},
		async close() {
			await browser.close()
			server.stop(true)
			await rm(directory, { recursive: true, force: true })
		},
	}
}
