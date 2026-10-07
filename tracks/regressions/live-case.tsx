import { RouterContext, liveQuery } from '@solidjs/router'
import { isServer } from '@solidjs/web'
import {
	createMemo,
	createStore,
	createOptimistic,
	createOptimisticStore,
	Loading,
	Show,
	For,
	Errored,
} from 'solid-js'

import { deferred, controlledIterable, ticks } from '../../harness/timing'
export function liveCase(kind: string) {
	const gate = deferred<{ id: number }[]>()
	const stream = controlledIterable<{ id: number }[]>()
	const rows = [{ id: 1 }, { id: 2 }]
	function source() {
		return isServer ? gate.promise : stream.iterable
	}
	const routed =
		kind === 'router'
			? (liveQuery(source, 'live-shell') as () => AsyncIterable<
					{ id: number }[]
				>)
			: undefined
	function Content() {
		if (kind === 'memo' || kind === 'optimistic' || kind === 'router') {
			const value =
				kind !== 'optimistic'
					? createMemo(routed ? () => routed() : source)
					: createOptimistic(source)[0]
			return (
				<Loading fallback={null}>
					<Show when={value().length}>
						<ul>
							<li>rows: {value().length}</li>
						</ul>
					</Show>
				</Loading>
			)
		}
		const [list] = kind.startsWith('store')
			? createStore(source, [], { key: 'id' })
			: createOptimisticStore(source, [], { key: 'id' })
		if (!kind.endsWith('no-derived'))
			createMemo(() => list.map((row) => row.id).join(','))
		return (
			<Errored fallback={(e) => <p>{String(e())}</p>}>
				<Loading fallback={null}>
					<ul>
						<For each={[...list]} keyed={(row) => row.id}>
							{(row) => <li>{row().id}</li>}
						</For>
					</ul>
				</Loading>
			</Errored>
		)
	}
	const App = () =>
		routed ? (
			<RouterContext
				value={
					{ navigatorFactory: () => () => {}, intent: () => undefined } as any
				}
			>
				<Content />
			</RouterContext>
		) : (
			<Content />
		)
	return {
		App,
		streams: isServer ? [] : [stream],
		async settle() {
			await ticks(isServer ? 30 : 2)
			if (isServer) gate.resolve(rows)
			else stream.push(rows)
			await ticks(8)
		},
	}
}
