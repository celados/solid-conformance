export type Operation =
	| { kind: 'answer'; request: number; value: number }
	| { kind: 'reject'; request: number }
	| { kind: 'argument'; request: number }
	| { kind: 'reconnect'; request: number }
	| { kind: 'mount'; visible: boolean }
	| { kind: 'navigate'; route: 'shared' | 'other'; request: number }
	| { kind: 'start-action'; value: number }
	| { kind: 'fail-action' }
	| { kind: 'click' }
export type TransitionSpec = {
	source: 'promise' | 'iterable'
	primitive: 'memo' | 'store' | 'projection' | 'optimistic-store'
	events: Operation[]
}
export type Trace = { operation: Operation | { kind: 'initial' }; dom: string; errors: string[]; actionErrors: number }
