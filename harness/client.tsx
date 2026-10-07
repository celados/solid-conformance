import { render, hydrate } from '@solidjs/web'

import type {} from './client-api'
import type { Spec } from './tree'

import { createCase } from './component'
import { ticks } from './timing'
const fixture = createCase(window.spec)
const events = [{ phase: 'module', at: performance.now() }]
const dispose =
	window.mode === 'hydrate'
		? hydrate(fixture.App, document.getElementById('root')!)
		: render(fixture.App, document.getElementById('root')!)
events.push({ phase: 'mounted', at: performance.now() })
if (window.mode === 'hydrate')
	void fetch(
		'/settle?boot=1&id=' + new URL(location.href).searchParams.get('id'),
	)
window.harness = {
	events,
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
		const root = document.getElementById('root')!.cloneNode(true) as HTMLElement
		root.querySelectorAll('script,template').forEach((el) => el.remove())
		root.querySelectorAll('*').forEach((el) => {
			for (const attr of [...el.attributes])
				if (attr.name === '_hk' || attr.name === 'data-hk')
					el.removeAttribute(attr.name)
		})
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
		const comments: Node[] = []
		while (walker.nextNode()) comments.push(walker.currentNode)
		comments.forEach((n) => n.parentNode?.removeChild(n))
		return root.innerHTML
	},
}
