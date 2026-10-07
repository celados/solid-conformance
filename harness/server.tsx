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
} from '@solidjs/web'

import type { Spec } from './tree'

import { createCase } from './component'
export function stream(spec: Spec, signal?: AbortSignal) {
	return requestScope.run(
		createRequestEvent(new Request('http://conformance.test/')),
		() => {
			const fixture = createCase(spec)
			const errors: string[] = []
			const output = renderToStream(fixture.App, {
				signal,
				manifest: { 'harness/lazy-part.tsx': { file: 'lazy-part.js' } },
				onError: (e) => errors.push(String(e)),
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
