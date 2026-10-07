import { normalizedDOM } from '../../harness/dom'
import { isServer } from '@solidjs/web'
import { createRouter, useNavigate, liveQuery, memoryHistory } from '@solidjs/router'
import {
	createMemo, createProjection, createStore, createOptimisticStore,
	createSignal, createOptimistic, action, Show, Loading, Errored,
	configureClientErrors, untrack,
} from 'solid-js'
import type { TransitionSpec, Trace, Operation } from '../../harness/transitions'
import type { Tree } from '../../harness/tree'
import { deferred, controlledIterable, ticks } from '../../harness/timing'

export function transitionCase(spec: TransitionSpec, tree: Tree) {
	const requests = Array.from({ length: 8 }, () => ({
		gate: deferred<{ value: number; request: number }>(),
		stream: controlledIterable<{ value: number; request: number }>(),
		error: new Error('source-failure'),
	}))
	// Rejections can happen before a branch subscribes. Consume the host promise
	// rejection while preserving the rejected promise that Solid reads.
	for (const r of requests) void r.gate.promise.catch(() => {})
	const streams = requests.map(r => r.stream)
	const trace: Trace[] = [], errors: string[] = []
	let setRequest!: (v: number) => void, setMounted!: (v: boolean) => void
	let navigate!: ReturnType<typeof useNavigate>
	let begin!: (v: number) => Promise<unknown>
	const actionGate = deferred<void>()
	let actionErrors = 0, actionDone: Promise<unknown> | undefined
	if (!isServer) configureClientErrors({ onError: error => { errors.push(String(error)) } })
	const shared = liveQuery((id: number) => requests[id]!.stream.iterable, 'wave2-shared')
	function Panel(props: { shared?: boolean }) {
		const [request, changeRequest] = createSignal(0)
		const [overlay, setOverlay] = createOptimistic(0)
		const [overlayStore, setOverlayStore] = createOptimisticStore({ value: 0 })
		const [user, setUser] = createSignal(0)
		setRequest = changeRequest
		function source() {
			const id = request()
			return spec.source === 'promise' ? requests[id]!.gate.promise
				: props.shared ? shared(id) : requests[id]!.stream.iterable
		}
		const data = spec.primitive === 'memo' ? createMemo(source, { ssrSource: 'hybrid' })
			: spec.primitive === 'projection' ? (() => { const s = createProjection(source, { value: -1, request: -1 }, { ssrSource: 'hybrid' }); return () => s })()
			: spec.primitive === 'store' ? (() => { const [s] = createStore(source, { value: -1, request: -1 }, { ssrSource: 'hybrid' }); return () => s })()
			: (() => { const [s] = createOptimisticStore(source, { value: -1, request: -1 }, { ssrSource: 'hybrid' }); return () => s })()
		begin = action(function* (value: number) { setOverlay(value); setOverlayStore(d => { d.value = value }); yield actionGate.promise })
		return <><button onClick={() => setUser(v => v + 1)}>click</button><em>{user()}</em><strong>{overlay()}</strong><small>{overlayStore.value}</small>
			<Errored fallback={(_error) => <b>outer-error</b>}>
				<Errored fallback={(_error) => <b>source-error</b>}>
					<Loading fallback={<i>pending</i>}><span data-request={data().request}>{data().value}</span></Loading>
				</Errored>
			</Errored></>
	}
	const hasRouter = spec.events.some(e => e.kind === 'navigate')
	const Router = createRouter({ routes: [
		{ path: '/', component: () => <Panel shared /> },
		{ path: '/shared', component: () => <Panel shared /> },
		{ path: '/other', component: () => <Panel /> },
	], history: memoryHistory('/') })
	function Content() {
		const [mounted, changeMounted] = createSignal(true)
		setMounted = changeMounted
		return <Show when={mounted()}>{hasRouter ? <Router>{props => { navigate = useNavigate(); return <>{props.children}</> }}</Router> : <Panel />}</Show>
	}
	function Wrapped(props: { node: Tree }) {
		const n = untrack(() => props.node)
		if (!n.children.length) return <Content />
		const child = () => <Wrapped node={n.children[0]!} />
		return n.kind === 'loading' ? <Loading fallback={<i>pending</i>}>{child()}</Loading>
			: n.kind === 'show' ? <Show when={true}>{child()}</Show> : child()
	}
	function answer(id: number, value: number) {
		const item = { request: id, value }
		requests[id]!.gate.resolve(item); requests[id]!.stream.push(item)
	}
	async function snapshot(operation: Trace['operation']) {
		await ticks(8)
		if (!isServer) trace.push({ operation, dom: normalizedDOM(document.querySelector<HTMLElement>('#root')!), errors: [...errors], actionErrors })
	}
	return {
		App: () => <Wrapped node={tree} />, streams, trace,
		async settle() {
			answer(0, 0)
			await snapshot({ kind: 'initial' })
			if (isServer) return
			for (const event of spec.events) {
				switch (event.kind) {
					case 'answer': answer(event.request, event.value); break
					case 'reject': requests[event.request]!.gate.reject(requests[event.request]!.error); requests[event.request]!.stream.fail(requests[event.request]!.error); break
					case 'argument': case 'reconnect': setRequest(event.request); break
					case 'mount': setMounted(event.visible); break
					case 'navigate': navigate('/' + event.route); await ticks(8); setRequest(event.request); break
					case 'start-action': actionDone = begin(event.value).catch(() => { actionErrors++ }); break
					case 'fail-action': actionGate.reject(new Error('action-failure')); await actionDone; break
					case 'click': document.querySelector<HTMLButtonElement>('button')?.click(); break
				}
				await snapshot(event)
			}
		},
	}
}
