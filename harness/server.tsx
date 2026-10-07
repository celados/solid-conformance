import { RequestContext, createRequestEvent } from '@solidjs/web'
import { AsyncLocalStorage } from 'node:async_hooks'
// Every compiled entry shares the host's ambient request-context bridge, while
// each render receives its own RequestEvent and cache.
const host = globalThis as typeof globalThis & {
	[key: symbol]:
		| AsyncLocalStorage<ReturnType<typeof createRequestEvent>>
		| undefined
}
const requestScope = (host[RequestContext] ??= new AsyncLocalStorage<
	ReturnType<typeof createRequestEvent>
>())
export async function inRequest<T>(fn: () => T) {
	return requestScope.run(
		createRequestEvent(new Request('http://conformance.test/')),
		fn,
	)
}
import {
	renderToStream,
	renderToString,
	generateHydrationScript,
	HydrationScript, NoHydration, Hydration,
} from '@solidjs/web'

import type { Spec } from './tree'

import { createCase } from './component'
export function stream(spec: Spec, signal?: AbortSignal, documentId?: string) {
	return requestScope.run(
		createRequestEvent(new Request('http://conformance.test/')),
		() => {
			const fixture = createCase(spec)
			const errors: string[] = []
			const App = documentId === undefined ? fixture.App : () => <NoHydration><html><head><HydrationScript /></head><body>
				<script innerHTML={`window.spec=${JSON.stringify(spec).replaceAll('<', '\\u003c')};window.mode="hydrate"`} />
				<div id="root"><Hydration id="app"><fixture.App /></Hydration></div><script type="module" async src="/client.js" />
			</body></html></NoHydration>
			const output = renderToStream(App, {
				signal,
				manifest: { 'harness/lazy-part.tsx': { file: 'lazy-part.js' } },
				onError: (e) => { errors.push(String(e)) },
			})
			return {
				output,
				settle: fixture.settle,
				errors,
				streams: fixture.streams,
			}
		},
	)
}
export function sync(spec: Spec) {
	return requestScope.run(
		createRequestEvent(new Request('http://conformance.test/')),
		() => renderToString(createCase(spec).App),
	)
}
export { generateHydrationScript }
export { discovery } from '../tracks/regressions/ssr-cases'
export { renderToStream }

export { iterableDiscoveryCase } from '../findings/002-iterable-discovery/component'

export { isDev } from '@solidjs/web'
export { runDocCases } from '../tracks/docs/cases'
