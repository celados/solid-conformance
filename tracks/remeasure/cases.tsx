// Shared SSR cases for the rc.13 / rc.16 re-measurement of
// "server <Loading> discovery converges only on an already-settled Promise".
// Every source below returns a NEW, genuinely pending answer on each call.
import { RouterContext, query, liveQuery } from '@solidjs/router'
import { createMemo, createContext, Loading, Show, For, Errored, lazy } from 'solid-js'

const delay = <T,>(value: T, ms: number) => new Promise<T>((r) => setTimeout(() => r(value), ms))
export type SourceKind = 'promise' | 'iterable' | 'query' | 'liveQuery'
export type Shape = 'hole' | 'fn-hole-lazy' | 'errored-retry' | 'show' | 'for'
export const sources: SourceKind[] = ['promise', 'iterable', 'query', 'liveQuery']
export const shapes: Shape[] = ['hole', 'fn-hole-lazy', 'errored-retry', 'show', 'for']

export function fixture(shape: Shape, kind: SourceKind) {
	let calls = 0
	const tag = `${shape}-${kind}-${Math.random().toString(36).slice(2)}`
	// fresh pending answer per invocation
	const fresh = (v: string): any =>
		kind === 'iterable' || kind === 'liveQuery'
			? (async function* () { yield await delay(v, 5) })()
			: delay(v, 5)
	const request =
		kind === 'query' ? query(async () => { calls++; return delay('v', 5) }, 'q-' + tag)
		: kind === 'liveQuery' ? liveQuery(async function* () { calls++; yield await delay('v', 5) }, 'lq-' + tag)
		: undefined
	// The source a component's setup reads: bare => fresh answer on every call
	const read = (v = 'v'): any => {
		if (request) return request()
		calls++
		return fresh(v)
	}
	function Child() {
		const value = createMemo(() => read())
		const now = value()
		return <p>{now}</p>
	}
	function Content() {
		const user = createMemo(() => delay(true, 5))
		return (
			<Loading fallback="pending">
				<div>
					{shape === 'show' ? <Show when={user()}><Child /></Show>
					: shape === 'for' ? <For each={user() ? [1] : []}>{() => <Child />}</For>
					: user() && <Child />}
				</div>
			</Loading>
		)
	}
	// #3815 shape: a function hole creating a component whose lazy view is pending
	function FnHole() {
		const Profile = lazy(() => delay({ default: (p: any) => <h1>{p.name}</h1> }, 5))
		function Page() {
			const user = createMemo(() => delay({ name: 'Jon' }, 20))
			const info = createMemo(() => { user(); return read('v') })
			return <Profile name={user().name + ':' + String(info())} />
		}
		return <main>{(() => <Page />) as any}</main>
	}
	// #3815 / #3750 shape: Errored wrapping a Loading re-created with a fresh pending source per setup
	const Ctx = createContext<boolean>()
	function ErroredRetry() {
		function Page() {
			const user = createMemo(() => delay({ name: 'Jon' }, 30))
			const info = createMemo(() => { const n = user().name; return read(n) })
			return <Loading fallback="pending"><Show when={info()}>{(n: any) => <p>{n()}</p>}</Show></Loading>
		}
		const later = createMemo(() => delay('LATER', 10))
		return <Ctx value={true}><Errored fallback={(e: any) => String(e())}><Page /></Errored>{later()}</Ctx>
	}
	const body = () => shape === 'fn-hole-lazy' ? <FnHole /> : shape === 'errored-retry' ? <ErroredRetry /> : <Content />
	const App = () =>
		request
			? <RouterContext value={{ navigatorFactory: () => () => {}, intent: () => undefined } as any}>{body()}</RouterContext>
			: body()
	return { App, calls: () => calls }
}
