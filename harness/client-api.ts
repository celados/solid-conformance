import type { Spec } from './tree'
export type IteratorStats = { opened: number; closed: number }
export type TimingEvent = { phase: string; at: number }
export type ClientHarness = {
	events: TimingEvent[]
	runtime: { isDev: boolean }
	docs: import('../tracks/docs/registry').DocResult[]
	trace: import('./transitions').Trace[]
	settle(): Promise<void>
	unmount(): Promise<IteratorStats[]>
	dom(): string
}
declare global {
	interface Window {
		spec: Spec
		mode: string
		harness: ClientHarness
	}
}
