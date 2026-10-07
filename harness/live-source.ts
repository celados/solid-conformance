import { isServer } from '@solidjs/web'

import { deferred, controlledIterable, ticks } from './timing'
export function liveSource<T>(value: T) {
	const gate = deferred<T>()
	const stream = controlledIterable<T>()
	return {
		source: () => (isServer ? gate.promise : stream.iterable),
		streams: isServer ? [] : [stream],
		async settle() {
			await ticks(isServer ? 30 : 2)
			if (isServer) gate.resolve(value)
			else stream.push(value)
			await ticks(8)
		},
	}
}
