/** A real fetch/SSE adapter whose pending next() is cancelled by return(). */
export function sseSource(id: string) {
	const stats = { opened: 0, closed: 0 }
	const iterable: AsyncIterable<{ value: number }> = {
		[Symbol.asyncIterator]() {
			let opened = false, closed = false, controller: AbortController | undefined
			let reader: ReadableStreamDefaultReader<Uint8Array> | undefined, buffer = ''
			const decoder = new TextDecoder()
			async function pump(): Promise<IteratorResult<{ value: number }>> {
				while (!closed) {
					if (!reader) {
						const response = await fetch(`/transport/events?id=${encodeURIComponent(id)}`, { signal: controller!.signal })
						if (!response.ok || !response.body) throw new Error(`SSE HTTP ${response.status}`)
						reader = response.body.getReader(); buffer = ''
					}
					let boundary: number
					while ((boundary = buffer.indexOf('\n\n')) >= 0) {
						const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2)
						if (!frame.startsWith('data: ')) continue
						const payload = JSON.parse(frame.slice(6)) as { kind: 'push' | 'error'; value?: number }
						if (payload.kind === 'error') throw Object.assign(new Error('terminal-source-error'), { status: 400 })
						return { done: false, value: { value: payload.value! } }
					}
					const chunk = await reader.read()
					if (chunk.done) { reader.releaseLock(); reader = undefined; continue }
					buffer += decoder.decode(chunk.value, { stream: true })
				}
				return { done: true, value: undefined }
			}
			return {
				next() {
					// A hydration trace swaps Promise for an executor-free mock. Opening
					// transport inside this executor prevents a trace-only subscription.
					return new Promise<IteratorResult<{ value: number }>>((resolve, reject) => {
						if (closed) { resolve({ done: true, value: undefined }); return }
						if (!opened) { opened = true; stats.opened++; controller = new AbortController() }
						void pump().then(resolve, error => { if (closed) resolve({ done: true, value: undefined }); else { close(); reject(error) } })
					})
				},
				async return() { close(); return { done: true as const, value: undefined } },
			}
			function close() { if (!closed) { closed = true; if (opened) stats.closed++; controller?.abort(); void reader?.cancel().catch(() => {}) } }
		},
	}
	Object.defineProperty(iterable, Symbol.for('solid.LiveSource'), { value: true })
	return { iterable, stats }
}
