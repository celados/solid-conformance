import { captureArtifact } from '@solidjs/diagnostics'
import { isServer } from '@solidjs/web'
import {
	action,
	createRoot,
	createOptimistic,
	createOptimisticStore,
	createEffect,
	flush,
} from 'solid-js'

import { ticks, controlledIterable } from '../../harness/timing'
export function optimisticCase() {
	async function body(
		sourceKind: string,
		observed: boolean,
		nested: boolean,
		primitive: string,
	) {
		let last = '',
			run!: () => Promise<unknown>
		const stream = controlledIterable<{ id: string; done: boolean }[]>()
		const rows = [{ id: 'a', done: false }]
		stream.push(rows)
		const dispose = createRoot((d) => {
			const [list, setList] = createOptimisticStore(
				() =>
					sourceKind === 'promise' ? Promise.resolve(rows) : stream.iterable,
				[],
				{ key: 'id' },
			)
			const [busy, setBusy] = createOptimistic(false)
			createEffect(
				() => `${list.map((r) => `${r.id}:${r.done}`).join(' ')}|${busy()}`,
				(v) => {
					last = v
				},
			)
			const inner = action(function* () {
				if (primitive === 'store')
					setList((l) => {
						l[0]!.done = true
					})
				else setBusy(true)
				try {
					yield Promise.reject(new Error('expected'))
				} catch {}
			})
			const outer = action(function* () {
				yield inner()
			})
			run = () => (nested ? outer() : inner())
			return d
		})
		try {
			await ticks()
			flush()
			await run()
			await ticks()
			flush()
			if (last !== 'a:false|false')
				throw new Error(
					`Optimistic revert: ${sourceKind}/${observed}/${nested}/${primitive}: ${last}`,
				)
		} finally {
			dispose()
			await ticks()
		}
		if (stream.stats.opened !== stream.stats.closed)
			throw new Error('Optimistic source leaked')
	}
	return {
		App: () => <span>optimistic</span>,
		streams: [],
		async settle() {
			if (isServer) return
			for (const source of ['promise', 'iterable'])
				for (const observed of [false, true])
					for (const nested of [false, true])
						for (const primitive of ['store', 'signal']) {
							if (observed)
								await captureArtifact(
									() => body(source, observed, nested, primitive),
									{ scenario: '3687-neighbors' },
								)
							else await body(source, observed, nested, primitive)
						}
		},
	}
}
