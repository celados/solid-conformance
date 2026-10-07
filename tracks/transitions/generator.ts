import fc from 'fast-check'
import type { Operation, TransitionSpec } from '../../harness/transitions'

export const families = ['supersede', 'reject-before', 'reject-after', 'reconnect', 'remount', 'route-shared', 'route-other', 'action-failure'] as const
export function sequence(family: typeof families[number], value: number, reverse: boolean): Operation[] {
	const answers: Operation[] = [ { kind: 'answer', request: 1, value: 101 }, { kind: 'answer', request: 2, value } ]
	switch (family) {
		case 'supersede': return [{ kind: 'argument', request: 1 }, { kind: 'click' }, { kind: 'argument', request: 2 }, ...(reverse ? answers.reverse() : answers)]
		case 'reject-before': return [{ kind: 'argument', request: 1 }, { kind: 'reject', request: 1 }]
		case 'reject-after': return [{ kind: 'argument', request: 1 }, { kind: 'answer', request: 1, value }, { kind: 'reject', request: 1 }]
		case 'reconnect': return [{ kind: 'argument', request: 1 }, { kind: 'answer', request: 1, value: 101 }, { kind: 'reconnect', request: 2 }, ...answers.slice(1)]
		case 'remount': return [{ kind: 'argument', request: 1 }, { kind: 'mount', visible: false }, { kind: 'answer', request: 1, value: 101 }, { kind: 'mount', visible: true }, { kind: 'argument', request: 2 }, { kind: 'answer', request: 2, value }]
		case 'route-shared': case 'route-other': return [{ kind: 'argument', request: 1 }, { kind: 'navigate', route: family === 'route-shared' ? 'shared' : 'other', request: 2 }, ...(reverse ? answers.reverse() : answers)]
		case 'action-failure': return [{ kind: 'start-action', value: 99 }, { kind: 'argument', request: 1 }, { kind: 'click' }, { kind: 'answer', request: 1, value }, { kind: 'fail-action' }]
	}
}
export const scenarios = fc.record({
	family: fc.constantFrom(...families), source: fc.constantFrom('promise' as const, 'iterable' as const),
	primitive: fc.constantFrom('memo' as const, 'store' as const, 'projection' as const, 'optimistic-store' as const),
	value: fc.integer({ min: 1, max: 9 }), reverse: fc.boolean(),
}).map(s => ({ ...s, spec: { source: s.source, primitive: s.primitive, events: sequence(s.family, s.value, s.reverse) } satisfies TransitionSpec }))
export { fc }

// The same router operation algebra drives the functional track and transition invariants.
export {routerOperations as routerTransitions} from '../router/generator'
