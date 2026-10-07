import { RouterContext, query, liveQuery } from '@solidjs/router'
import { createMemo, Loading, Show, For, Errored } from 'solid-js'
export function discovery(kind: string, sourceKind: string) {
	let calls = 0
	const base = Promise.resolve('v')
	const request =
		sourceKind === 'query'
			? query(() => base, 'discovery-query')
			: sourceKind === 'liveQuery'
				? liveQuery(async function* () {
						yield await base
					}, 'discovery-live')
				: undefined
	function Child() {
		const value = createMemo(() => {
			calls++
			if (request) return request()
			if (sourceKind === 'promise') return base.then((v) => v)
			return (async function* () {
				yield await base
			})()
		})
		const now = value()
		return <p>{now}</p>
	}
	function Content() {
		const user = createMemo(() => Promise.resolve(true))
		return (
			<Loading fallback="pending">
				<div>
					{kind === 'show' ? (
						<Show when={user()}>
							<Child />
						</Show>
					) : kind === 'for' ? (
						<For each={user() ? [1] : []}>{() => <Child />}</For>
					) : kind === 'errored' ? (
						<Errored fallback={(e) => String(e())}>
							{user() && <Child />}
						</Errored>
					) : (
						user() && <Child />
					)}
				</div>
			</Loading>
		)
	}
	const App = () =>
		request ? (
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
	return { App, calls: () => calls }
}
