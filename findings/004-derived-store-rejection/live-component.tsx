import { createStore, Errored } from 'solid-js'
import { isServer } from '@solidjs/web'
import { ticks } from '../../harness/timing'
export function liveStoreRejectionCase() {
	let reject!: (reason: Error) => void
	const live = {
		[Symbol.for('solid.LiveSource')]: true,
		[Symbol.asyncIterator]() {
			return {
				next: () => new Promise<IteratorResult<{ value: number }>>((_resolve, no) => { reject = no }),
				return: () => Promise.resolve({ done: true as const, value: undefined }),
			}
		},
	}
	function App() {
		const [value] = createStore<{ value: number }>(() => isServer ? Promise.resolve({ value: 0 }) : live, { value: 0 })
		return <Errored fallback={(_error) => <b>error</b>}><span>{value.value}</span></Errored>
	}
	return { App, streams: [], async settle() { if (!isServer) { await ticks(); reject(new Error('expected')); await ticks(30) } } }
}
