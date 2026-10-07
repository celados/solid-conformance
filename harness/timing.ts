const NativePromise = Promise
export function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new NativePromise<T>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}
export function controlledIterable<T>() {
	type Delivery = { kind: 'value'; value: T } | { kind: 'error'; error: unknown } | { kind: 'end' }
	const history: Delivery[] = []
	const listeners = new Set<() => void>()
	const stats = { opened: 0, closed: 0 }
	function deliver(item: Delivery) {
		history.push(item)
		for (const wake of [...listeners]) wake()
	}
	const iterable: AsyncIterable<T> = {
		...{ [Symbol.for('solid.LiveSource')]: true },
		[Symbol.asyncIterator]() {
			stats.opened++
			let cursor = 0, closed = false
			let pending: ReturnType<typeof deferred<IteratorResult<T>>> | undefined
			function close() {
				if (!closed) { closed = true; stats.closed++ }
				listeners.delete(wake)
			}
			function wake() {
				if (!pending || (!closed && cursor === history.length)) return
				const waiter = pending
				pending = undefined
				const item = history[cursor++]
				if (closed || item?.kind === 'end') {
					close(); waiter.resolve({ done: true, value: undefined })
				} else if (item?.kind === 'error') {
					close(); waiter.reject(item.error)
				} else if (item?.kind === 'value') waiter.resolve({ done: false, value: item.value })
			}
			listeners.add(wake)
			return {
				next() {
					if (pending) throw new Error('Concurrent next() is unsupported')
					const waiter = deferred<IteratorResult<T>>()
					pending = waiter; wake(); return waiter.promise
				},
				async return() {
					close(); wake()
					return { done: true as const, value: undefined }
				},
			}
		},
	}
	return {
		iterable, stats,
		push(value: T) { deliver({ kind: 'value', value }) },
		fail(error: unknown) { deliver({ kind: 'error', error }) },
		end() { deliver({ kind: 'end' }) },
	}
}
export function permutations<T>(items: T[]): T[][] {
	if (items.length > 7)
		throw new Error('Use sampled orders for more than seven sources')
	if (!items.length) return [[]]
	return items.flatMap((item, i) =>
		permutations(items.filter((_, j) => i !== j)).map((tail) => [
			item,
			...tail,
		]),
	)
}
export async function ticks(count = 8) {
	for (let i = 0; i < count; i++)
		await new NativePromise((resolve) => setTimeout(resolve, 0))
}
