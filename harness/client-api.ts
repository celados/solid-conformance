import type { Spec } from './tree'
export type IteratorStats = { opened: number; closed: number }
export type TimingEvent = { phase: string; at: number }
export type ClientHarness = {
	events: TimingEvent[]
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
