import { test, expect } from 'bun:test'

import {
	deferred,
	controlledIterable,
	permutations,
} from '../../harness/timing'
test('deferred promises and iterators follow the chosen settlement order', async () => {
	for (const order of permutations([0, 1, 2])) {
		const gates = [deferred<number>(), deferred<number>(), deferred<number>()]
		const seen: number[] = []
		gates.forEach((g) => {
			void g.promise.then((v) => seen.push(v))
		})
		for (const i of order) {
			gates[i]!.resolve(i)
			await Promise.resolve()
		}
		expect(seen).toEqual(order)
	}
	const source = controlledIterable<number>()
	const it = source.iterable[Symbol.asyncIterator]()
	const waiting = it.next()
	source.push(7)
	expect(await waiting).toEqual({ value: 7, done: false })
	const pending = it.next()
	await it.return!()
	expect((await pending).done).toBe(true)
	await it.return!()
	expect(source.stats).toEqual({ opened: 1, closed: 1 })
})
