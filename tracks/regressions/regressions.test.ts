import { transform, projectTsrxForTypecheck } from '@solidjs/compiler'
import { test, expect } from 'bun:test'

import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
import { build } from '../../scripts/build'
const fixed = process.env.EXPECT_FIXED === '1'
test('#3762: native TSRX setup declarations, DOM and SSR, projection parity', () => {
	for (const declaration of [
		'const a = () => 1',
		'let a = 1',
		'const { a } = { a: 1 }',
	]) {
		const value = declaration.includes('=>') ? 'a()' : 'a'
		const code = `export function F() @{\n${declaration}\n<div>{${value}}</div>\n}`
		expect(
			projectTsrxForTypecheck(code, { filename: 'F.tsrx' }).code,
		).toContain('return')
		for (const generate of ['dom', 'ssr'] as const) {
			if (fixed)
				expect(() =>
					transform(code, { filename: 'F.tsrx', generate }),
				).not.toThrow()
			else
				expect(() => transform(code, { filename: 'F.tsrx', generate })).toThrow(
					'Unable to load authored TSRX statement',
				)
			expect(() =>
				transform(code.replace(declaration, declaration + ';'), {
					filename: 'F.tsrx',
					generate,
				}),
			).not.toThrow()
		}
	}
})
test('#3734: compiled holes with promise/iterable sources and For/Show/Errored neighbors', async () => {
	await build()
	const ssr =
		(await import('../../.build/server.js')) as typeof import('../../harness/server')
	for (const placement of ['hole', 'show', 'for', 'errored'])
		for (const source of ['promise', 'iterable', 'query', 'liveQuery']) {
			const fixture = ssr.discovery(placement, source)
			const errors: string[] = []
			const output = await ssr.inRequest(() =>
				Promise.resolve(
					ssr.renderToStream(fixture.App, {
						onError: (e: unknown) => errors.push(String(e)),
					}) as PromiseLike<string>,
				),
			)
			if (['iterable', 'liveQuery'].includes(source) && !fixed) {
				expect(errors).toHaveLength(1)
				expect(errors[0]).toContain(
					'discovery did not converge after 10001 passes',
				)
				expect(output).not.toMatch(/<p[^>]*>v<\/p>/)
			} else {
				expect(errors).toEqual([])
				expect(output).toMatch(/<p[^>]*>v<\/p>/)
				expect(fixture.calls()).toBeLessThan(20)
			}
		}
}, 30000)
test('#3764: streamed shell live memo/store/optimistic neighbors in Chrome', async () => {
	const h = await openHarness()
	try {
		for (const kind of [
			'memo',
			'store',
			'optimistic-store',
			'optimistic',
			'router',
		]) {
			const result = await h.run(
				{ tree: leaf(), order: [], scenario: `live:${kind}` },
				'hydrate',
			)
			const expected = kind.includes('store')
				? '<ul><li>1</li><li>2</li></ul>'
				: '<ul><li>rows: 2</li></ul>'
			if (!fixed && kind.includes('store')) {
				expect(result.dom).toBe(
					expected +
						"<p>TypeError: Cannot read properties of undefined (reading 'id')</p>",
				)
				expect(result.messages).toEqual([])
			} else if (!fixed && result.dom !== expected) {
				expect(result.dom).toBe(expected + expected)
				expect(result.messages.length).toBeGreaterThan(0)
				for (const message of result.messages)
					expect(message).toContain('unclaimed server-rendered node')
			} else {
				expect(result.dom).toBe(expected)
				expect(result.messages).toEqual([])
			}
			expect(result.serverChunks.length).toBeGreaterThan(1)

			expect(result.serverErrors).toEqual([])
			for (const stats of result.stats) {
				expect(stats.opened).toBe(1)
				expect(stats.closed).toBe(1)
			}
		}
	} finally {
		await h.close()
	}
}, 30000)
test('#3687: signal/store rollback with attribution off/on, promise/iterable, nested actions', async () => {
	const h = await openHarness()
	try {
		const result = await h.run(
			{ tree: leaf(), order: [], scenario: 'optimistic-matrix' },
			'csr',
		)
		expect(result.messages).toEqual([])
		expect(result.dom).toBe('<span>optimistic</span>')
	} finally {
		await h.close()
	}
}, 30000)
test('#3338: root/nested/Errored lazy hydration and missing-manifest error reporting', async () => {
	const h = await openHarness()
	try {
		for (const placement of ['root', 'nested', 'errored']) {
			const result = await h.run(
				{ tree: leaf(), order: [], scenario: `lazy:${placement}` },
				'hydrate',
			)
			expect(result.dom).toBe('<span>1</span>')
			expect(result.messages).toEqual([])
		}
		await expect(
			h.run({ tree: leaf(), order: [], scenario: 'lazy:missing' }, 'hydrate'),
		).rejects.toThrow('pageerror: lazy() module "missing.tsx"')
	} finally {
		await h.close()
	}
}, 30000)
