import { normalizedDOM } from './dom'
import { render, hydrate, isDev } from '@solidjs/web'

import type {} from './client-api'
import type { Spec } from './tree'

import { createCase } from './component'
import { ticks } from './timing'
const fixture = createCase(window.spec)
const events = [{ phase: 'module', at: performance.now() }]
const dispose =
	window.mode === 'hydrate'
		? hydrate(fixture.App, document.getElementById('root')!, { renderId: 'app' })
		: render(fixture.App, document.getElementById('root')!)
events.push({ phase: 'mounted', at: performance.now() })
if (window.mode === 'hydrate')
	void fetch(
		'/settle?boot=1&id=' + new URL(location.href).searchParams.get('id'),
	)
window.harness = {
	events,
	docs: 'docs' in fixture ? fixture.docs as import('../tracks/docs/registry').DocResult[] : [],
	runtime: { isDev },
	trace: 'trace' in fixture ? fixture.trace as import('./transitions').Trace[] : [],
	async settle() {
		events.push({ phase: 'settle-start', at: performance.now() })
		await fixture.settle()
		events.push({ phase: 'settled', at: performance.now() })
	},
	async unmount() {
		dispose()
		await ticks()
		return fixture.streams.map((s) => s.stats)
	},
	dom() {
		return normalizedDOM(document.getElementById('root')!)
	},
}
