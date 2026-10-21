// Re-measure of: (ii) failed action does not roll back createOptimisticStore overlay when attribution is on
// (solidjs/solid#3687); (i) cost findings volume with attribution on, on a typical list+store+memo page.
// Run: cd tracks/remeasure/<rcNN> && bun test --conditions browser --conditions development ./attribution.test.ts
import { captureArtifact } from '@solidjs/diagnostics'
import { test, expect } from 'bun:test'
import { action, createRoot, createOptimistic, createOptimisticStore, createStore, createEffect, createMemo, createSignal, mapArray, flush } from 'solid-js'
import { readFileSync } from 'node:fs'
// NOTE: this file is copied into each rcNN/ directory (a symlink would resolve to the repo root's node_modules).

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const ticks = async (n = 4) => { for (let i = 0; i < n; i++) await tick() }
const version = JSON.parse(readFileSync('node_modules/solid-js/package.json', 'utf8')).version

async function rollbackCase(sourceKind: 'promise' | 'iterable', nested: boolean, primitive: 'store' | 'signal') {
	let last = '', run!: () => Promise<unknown>
	const rows = [{ id: 'a', done: false }]
	const source = () => sourceKind === 'promise' ? Promise.resolve(rows)
		: (async function* () { yield rows; await new Promise(() => {}) })()
	const dispose = createRoot((d) => {
		const [list, setList] = createOptimisticStore(source, [] as typeof rows, { key: 'id' })
		const [busy, setBusy] = createOptimistic(false)
		createEffect(() => `${list.map((r) => `${r.id}:${r.done}`).join(' ')}|${busy()}`, (v) => { last = v })
		const inner = action(function* () {
			if (primitive === 'store') setList((l) => { l[0]!.done = true })
			else setBusy(true)
			try { yield Promise.reject(new Error('expected')) } catch {}
		})
		const outer = action(function* () { yield inner() })
		run = () => (nested ? outer() : inner())
		return d
	})
	await ticks(); flush()
	await run()
	await ticks(); flush()
	dispose(); await ticks()
	return last
}
const matrix: [any, boolean, any][] = []
for (const s of ['promise', 'iterable']) for (const n of [false, true]) for (const p of ['store', 'signal']) matrix.push([s, n, p])

for (const attribution of [false, true]) {
	test(`#3687 rollback, attribution=${attribution} (solid-js ${version})`, async () => {
		const results: Record<string, string> = {}
		for (const [s, n, p] of matrix) {
			const { result } = await captureArtifact(() => rollbackCase(s, n, p), { scenario: '3687', attribution })
			results[`${s}/${n ? 'nested' : 'direct'}/${p}`] = result
		}
		console.log(JSON.stringify({ test: '3687', version, attribution, results }))
		for (const v of Object.values(results)) expect(v).toBe('a:false|false')
	}, 30000)
}

// Typical page: 200-row list from a store, derived totals via memos, a selection memo, a few updates.
async function pageScenario() {
	const dispose = createRoot((d) => {
		const [rows, setRows] = createStore(Array.from({ length: 200 }, (_, i) => ({ id: i, title: 'row ' + i, done: i % 3 === 0 })))
		const [filter, setFilter] = createSignal<'all' | 'open'>('all')
		const visible = createMemo(() => rows.filter((r) => filter() === 'all' || !r.done))
		const total = createMemo(() => visible().length)
		const doneCount = createMemo(() => rows.filter((r) => r.done).length)
		const label = createMemo(() => `${doneCount()}/${total()}`)
		const items = mapArray(visible, (row) => createMemo(() => row.title.toUpperCase() + (row.done ? ' (done)' : '')))
		let seen = ''
		createEffect(() => [label(), items().length].join('|'), (v) => { seen = v })
		;(globalThis as any).__page = { setRows, setFilter, rows: () => rows }
		return d
	})
	flush()
	const { setRows, setFilter } = (globalThis as any).__page
	for (let i = 0; i < 20; i++) { setRows((d: any) => { d[i].done = !d[i].done }); flush() }
	setFilter('open'); flush(); setFilter('all'); flush()
	for (let i = 0; i < 50; i++) { setRows((d: any) => { d[i].title = 'edited ' + i }); flush() }
	await ticks()
	dispose()
}
for (const attribution of [false, true]) {
	test(`cost findings on a list+store+memo page, attribution=${attribution} (solid-js ${version})`, async () => {
		const { artifact } = await captureArtifact(pageScenario, { scenario: 'page', attribution })
		const byCode: Record<string, number> = {}
		for (const d of artifact.diagnostics) byCode[d.code] = (byCode[d.code] ?? 0) + 1
		const costs = artifact.attribution?.costs
		console.log(JSON.stringify({ test: 'cost-findings', version, attribution, diagnostics: artifact.diagnostics.length, byCode,
			attributionKeys: artifact.attribution ? Object.keys(artifact.attribution) : null,
			costTables: costs ? Object.fromEntries(Object.entries(costs).map(([k, v]: any) => [k, Array.isArray(v) ? v.length : typeof v])) : null,
			reruns: artifact.attribution?.reruns?.length ?? null }))
	}, 30000)
}
