import { test, expect } from 'bun:test'
import { resolve } from 'node:path'

import { build } from '../../scripts/build'
test('a child reading a fresh iterable during setup converges', async () => {
	await build()
	const ssr = (await import(
		resolve('.build/server.js')
	)) as typeof import('../../harness/server')
	const errors: string[] = []
	const html = await Promise.resolve(
		ssr.renderToStream(ssr.iterableDiscoveryCase(), {
			onError: (e: unknown) => errors.push(String(e)),
		}) as PromiseLike<string>,
	)
	expect(errors).toEqual([])
	expect(html).toMatch(/<p[^>]*>v<\/p>/)
})
