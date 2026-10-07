import { test, expect } from 'bun:test'
import { realpath } from 'node:fs/promises'

import { openHarness } from '../../harness/browser'
import { permutations } from '../../harness/timing'
import { sourceIds, wrap, type Tree } from '../../harness/tree'
import { trees, fc } from './generator'
test('generated trees preserve DOM, settle order, wrappers and iterator cleanup', async () => {
	const harness = await openHarness()
	let runs = 0,
		browserRuns = 0
	const kinds: Record<string, number> = {}
	const seed = Number(process.env.SEED ?? 20261007)
	const resolvedSolid = await realpath('node_modules/solid-js')
	const runtime = {
		resolvedSolid,
		upstream: resolvedSolid.includes('/.upstream/')
			? await Bun.file('.upstream/active.json').json()
			: null,
		solid: await Bun.file('node_modules/solid-js/package.json')
			.json()
			.then((p) => p.version),
		signals: await Bun.file('node_modules/@solidjs/signals/package.json')
			.json()
			.then((p) => p.version),
		compiler: await Bun.file('node_modules/@solidjs/compiler/package.json')
			.json()
			.then((p) => p.version),
		label: process.env.TARGET ?? 'head',
		buildMode: harness.variant,
	}
	console.log(`Runtime ready: ${JSON.stringify(runtime)}`)
	const count = Number(process.env.CASES ?? 100)
	function check(result: Awaited<ReturnType<typeof harness.run>>) {
		expect(result.runtime.isDev).toBe(harness.variant === 'development')
		expect(harness.ssr.isDev).toBe(harness.variant === 'development')
		expect(result.messages).toEqual([])
		expect(result.serverErrors).toEqual([])
		expect(result.dom).not.toContain('pending')
		for (const stat of [...result.stats, ...result.serverStats])
			expect(stat.closed).toBe(stat.opened)
	}
	async function run(tree: Tree, order: number[], mode: 'csr' | 'hydrate') {
		browserRuns++
		const result = await harness.run({ tree, order }, mode)
		check(result)
		return result.dom
	}
	try {
		const details = await fc.check(
			fc.asyncProperty(trees(), fc.nat(), async (tree, target) => {
				runs++
				if (runs % 25 === 0)
					console.log(
						`Generated attempts: ${runs}; browser runs: ${browserRuns}`,
					)
				function visit(n: Tree) {
					kinds[n.kind] = (kinds[n.kind] ?? 0) + 1
					n.children.forEach(visit)
				}
				visit(tree)
				const ids = sourceIds(tree)
				const orders =
					ids.length <= 3
						? permutations(ids)
						: [
								ids,
								[...ids].reverse(),
								...fc.sample(
									fc.shuffledSubarray(ids, {
										minLength: ids.length,
										maxLength: ids.length,
									}),
									{ seed: seed + runs, numRuns: 4 },
								),
							]
				const baseline = await run(tree, ids, 'csr')
				function expected(n: Tree): string {
					return n.children.length
						? n.children.map(expected).join('')
						: [
									'show',
									'for',
									'keyed-for',
									'switch',
									'loading',
									'errored',
									'group',
							  ].includes(n.kind)
							? ''
							: `<span>${n.value}</span>`
				}
				expect(baseline).toBe(expected(tree))
				for (const order of orders) {
					expect(await run(tree, order, 'csr')).toBe(baseline)
					expect(await run(tree, order, 'hydrate')).toBe(baseline)
				}
				for (const kind of ['loading', 'show'] as const) {
					let count = 0
					function size(n: Tree) {
						count++
						n.children.forEach(size)
					}
					size(tree)
					let index = 0
					function transform(n: Tree): Tree {
						const current = index++
						const copy = { ...n, children: n.children.map(transform) }
						return current === target % count ? wrap(kind, copy) : copy
					}
					const wrapped = transform(tree)
					const order = sourceIds(wrapped)
					expect(await run(wrapped, order, 'csr')).toBe(baseline)
					expect(await run(wrapped, order, 'hydrate')).toBe(baseline)
				}
			}),
			{
				seed,
				numRuns: count,
				verbose: 1,
				...(process.env.REPLAY_PATH ? { path: process.env.REPLAY_PATH } : {}),
			},
		)
		await Bun.write(
			process.env.RECEIPT ?? 'artifacts/properties.json',
			JSON.stringify(
				{
					runtime,
					seed,
					requested: count,
					generated: details.numRuns,
					attemptsIncludingShrink: runs,
					browserRuns,
					kinds,
					failed: details.failed,
					counterexample: details.counterexample,
					counterexamplePath: details.counterexamplePath,
					error: String(details.errorInstance ?? ''),
				},
				null,
				2,
			),
		)
		console.log(
			JSON.stringify({
				seed,
				generated: details.numRuns,
				browserRuns,
				kinds,
				failed: details.failed,
			}),
		)
		if (details.failed) throw details.errorInstance
	} finally {
		await harness.close()
	}
}, 600000)
