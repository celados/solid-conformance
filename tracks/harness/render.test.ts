import { test, expect } from 'bun:test'
import { resolve } from 'node:path'

import { ticks } from '../../harness/timing'
import { leaf, sourceIds } from '../../harness/tree'
import { build } from '../../scripts/build'
test('SSR strings and streaming Loading produce shell and settled fragment', async () => {
	await build()
	const ssr = (await import(
		resolve('.build/server.js')
	)) as typeof import('../../harness/server')
	expect(ssr.sync({ tree: leaf('text', 7), order: [] })).toMatch(
		/<span[^>]*>7<\/span>/,
	)
	const tree = leaf('promise', 9)
	const run = ssr.stream({ tree, order: sourceIds(tree) })
	const chunks: string[] = []
	let finish!: () => void
	const done = new Promise<void>((resolve) => {
		finish = resolve
	})
	run.output.pipe({
		write: (value) => {
			chunks.push(value)
		},
		end: finish,
	})
	await ticks(2)
	expect(chunks.join('')).toContain('pending')
	await run.settle()
	await done
	expect(chunks.length).toBeGreaterThan(1)
	expect(chunks.join('')).toMatch(/<span[^>]*>9<\/span>/)
	expect(run.errors).toEqual([])
})
