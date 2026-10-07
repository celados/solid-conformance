import { createStore, createMemo, Loading, For } from 'solid-js'

import { liveSource } from '../../harness/live-source'
export function storeKeyedCase() {
	const timing = liveSource([{ id: 1 }])
	function App() {
		const [rows] = createStore(timing.source, [], { key: 'id' })
		createMemo(() => rows.map((row) => row.id))
		return (
			<Loading>
				<For each={[...rows]} keyed={(row) => row.id}>
					{(row) => <li>{row().id}</li>}
				</For>
			</Loading>
		)
	}
	return { App, ...timing }
}
