import { isServer } from '@solidjs/web'
import {
	Show,
	For,
	Switch,
	Match,
	Loading,
	Errored,
	createMemo,
	createStore,
	createOptimistic,
	createOptimisticStore,
	createSignal,
	createEffect,
	action,
	lazy,
	untrack,
} from 'solid-js'

import type { Spec, Tree } from './tree'

import { storeKeyedCase } from '../findings/001-streamed-store-keyed/component'
import { lazyCase } from '../tracks/regressions/lazy-case'
import { liveCase } from '../tracks/regressions/live-case'
import { optimisticCase } from '../tracks/regressions/optimistic-case'
import { storeRejectionCase } from '../findings/004-derived-store-rejection/component'
import { loadingAccessorCase } from '../findings/007-loading-on-accessor/component'
import { refreshCase } from '../findings/008-production-refresh/component'
import { docsCase } from '../tracks/docs/cases'
import { transitionCase } from '../tracks/transitions/component'
import { deferred, controlledIterable, ticks } from './timing'
export function createCase(spec: Spec) {
	if (spec.scenario === 'finding:004') return storeRejectionCase()
	if (spec.scenario === 'finding:007') return loadingAccessorCase()
	if (spec.scenario === 'finding:008') return refreshCase()
	if (spec.scenario === 'docs') return docsCase()
	if (spec.transition) return transitionCase(spec.transition, spec.tree)
	if (spec.scenario === 'minimal-store') return storeKeyedCase()
	if (spec.scenario?.startsWith('live:'))
		return liveCase(spec.scenario.split(':')[1]!)
	if (spec.scenario?.startsWith('lazy:'))
		return lazyCase(spec.scenario.split(':')[1]!)
	if (spec.scenario === 'optimistic-matrix') return optimisticCase()
	let nextId = 0
	const sources = new Map<number, ReturnType<typeof deferred<number>>>()
	const commands: (() => Promise<unknown>)[] = []
	const streams: ReturnType<typeof controlledIterable<number>>[] = []
	const streamMap = new Map<
		number,
		ReturnType<typeof controlledIterable<number>>
	>()
	const lazyLoads = new Map<
		number,
		ReturnType<typeof deferred<{ default: () => unknown }>>
	>()
	const ids = new WeakMap<Tree, number>()
	function assign(node: Tree) {
		ids.set(node, nextId++)
		node.children.forEach(assign)
	}
	assign(spec.tree)
	function prepare(node: Tree) {
		const id = ids.get(node)!
		if (node.kind === 'lazy') lazyLoads.set(id, deferred())
		else if (['promise', 'iterable'].includes(node.kind))
			sources.set(id, deferred())
		if (node.kind === 'iterable') {
			const stream = controlledIterable<number>()
			streamMap.set(id, stream)
			streams.push(stream)
			sources.get(id)!.promise.then((value) => stream.push(value))
		}
		node.children.forEach(prepare)
	}
	prepare(spec.tree)
	function promise(id: number) {
		if (!sources.has(id)) sources.set(id, deferred<number>())
		return sources.get(id)!.promise
	}
	function Node(props: { node: Tree }): any {
		const n = untrack(() => props.node),
			id = ids.get(n)!
		const kids = () => n.children.map((node) => <Node node={node} />)
		switch (n.kind) {
			case 'text':
				return <span>{n.value}</span>
			case 'promise': {
				const v = createMemo(() => promise(id))
				return <span>{v()}</span>
			}
			case 'iterable': {
				const stream = streamMap.get(id)!
				const v = createMemo(() => stream.iterable)
				return <span>{v()}</span>
			}
			case 'store': {
				const [s, set] = createStore({ value: n.value })
				const run = action(function* () {
					set((d) => {
						d.value = n.value + 1
					})
					yield ticks(2)
					set((d) => {
						d.value = n.value
					})
				})
				commands.push(() => run())
				return <span>{s.value}</span>
			}
			case 'optimistic': {
				const [v, set] = createOptimistic(n.value)
				const run = action(function* () {
					set(n.value + 1)
					yield ticks(2)
				})
				commands.push(() => run())
				return <span>{v()}</span>
			}
			case 'optimistic-store': {
				const [s, set] = createOptimisticStore({ value: n.value })
				const run = action(function* () {
					set((d) => {
						d.value = n.value + 1
					})
					yield ticks(2)
				})
				commands.push(() => run())
				return <span>{s.value}</span>
			}
			case 'action': {
				const [v, set] = createSignal(n.value)
				const run = action(function* () {
					set(n.value + 1)
					yield Promise.resolve()
					set(n.value)
				})
				commands.push(() => run())
				return <span onClick={() => run()}>{v()}</span>
			}
			case 'effect': {
				const [v, set] = createSignal(n.value + 1, { ownedWrite: true })
				createEffect(
					() => n.value,
					(value) => {
						if (value !== undefined) set(value)
					},
				)
				return <span>{v()}</span>
			}
			case 'lazy': {
				if (!lazyLoads.has(id)) lazyLoads.set(id, deferred())
				const Part = lazy(
					() => lazyLoads.get(id)!.promise.then(() => import('./lazy-part')),
					undefined,
					'harness/lazy-part.tsx',
				)
				return <Part value={n.value} />
			}
			case 'show':
				return <Show when={true}>{kids()}</Show>
			case 'for':
				return (
					<For each={n.children} keyed={false}>
						{(node) => <Node node={node()} />}
					</For>
				)
			case 'keyed-for':
				return (
					<For each={n.children} keyed={(node) => ids.get(node)!}>
						{(node) => <Node node={node()} />}
					</For>
				)
			case 'switch':
				return (
					<Switch>
						<Match when={true}>{kids()}</Match>
						<Match when={false}>
							<span>wrong</span>
						</Match>
					</Switch>
				)
			case 'loading':
				return <Loading fallback={<i>pending</i>}>{kids()}</Loading>
			case 'errored':
				return (
					<Errored fallback={(error) => <b>{String(error())}</b>}>
						{kids()}
					</Errored>
				)
			case 'group':
				return <>{kids()}</>
		}
	}
	async function settle() {
		for (const id of spec.order) {
			// Lazy descendants can register only after their parent resolves.
			await ticks(2)
			const node = find(spec.tree, id)
			if (node?.kind === 'lazy') {
				if (!lazyLoads.has(id)) lazyLoads.set(id, deferred())
				lazyLoads.get(id)!.resolve({ default: () => <span>{node.value}</span> })
			} else {
				promise(id)
				sources.get(id)!.resolve(node?.value ?? 1)
			}
			await ticks(2)
		}
		await ticks(8)
		if (!isServer)
			for (const command of commands) {
				await command()
				await ticks(2)
			}
		await ticks(8)
	}
	function find(node: Tree, id: number): Tree | undefined {
		if (ids.get(node) === id) return node
		for (const child of node.children) {
			const found = find(child, id)
			if (found) return found
		}
	}
	return {
		App: () => (
			<Loading fallback={<i>pending</i>}>
				<Node node={spec.tree} />
			</Loading>
		),
		settle,
		streams,
	}
}
