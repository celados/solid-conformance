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
	const queue: IteratorResult<T>[] = []
	const waiters: ReturnType<typeof deferred<IteratorResult<T>>>[] = []
	const stats = { opened: 0, closed: 0 }
	const iterable: AsyncIterable<T> = {
		// LiveSource enables takeover after hydration; the cast preserves the public iterable type.
		...{ [Symbol.for('solid.LiveSource')]: true },
		[Symbol.asyncIterator]() {
			stats.opened++
			let closed = false
			return {
				next() {
					if (closed)
						return NativePromise.resolve({ done: true, value: undefined })
					if (queue.length) return NativePromise.resolve(queue.shift()!)
					const waiter = deferred<IteratorResult<T>>()
					waiters.push(waiter)
					return waiter.promise
				},
				async return() {
					if (!closed) {
						closed = true
						stats.closed++
					}
					for (const waiter of waiters.splice(0))
						waiter.resolve({ done: true, value: undefined })
					return { done: true as const, value: undefined }
				},
			}
		},
	}
	return {
		iterable,
		stats,
		push(value: T) {
			const item = { done: false as const, value }
			const waiter = waiters.shift()
			if (waiter) waiter.resolve(item)
			else queue.push(item)
		},
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
