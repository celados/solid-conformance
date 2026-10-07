type Connection = { controller: ReadableStreamDefaultController<Uint8Array>; close: () => void }
export function controlledSSE() {
	const sessions = new Map<string, { opened: number; closed: number; connections: Set<Connection> }>()
	function session(id: string) {
		let value = sessions.get(id)
		if (!value) { value = { opened: 0, closed: 0, connections: new Set() }; sessions.set(id, value) }
		return value
	}
	return {
		async fetch(request: Request): Promise<Response | undefined> {
			const url = new URL(request.url)
			if (!url.pathname.startsWith('/transport/')) return
			const id = url.searchParams.get('id') ?? 'default', state = session(id)
			if (url.pathname === '/transport/status') return Response.json({ opened: state.opened, closed: state.closed, active: state.connections.size })
			if (url.pathname === '/transport/control') {
				const operation = await request.json() as { kind: 'push' | 'drop' | 'error'; value?: number }
				for (const connection of [...state.connections]) {
					if (operation.kind === 'drop') connection.close()
					else connection.controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(operation)}\n\n`))
				}
				return Response.json({ delivered: state.connections.size })
			}
			if (url.pathname !== '/transport/events') return new Response('Unknown transport endpoint', { status: 404 })
			let connection!: Connection
			const body = new ReadableStream<Uint8Array>({
				start(controller) {
					let closed = false
					const finish = () => { if (!closed) { closed = true; state.closed++; state.connections.delete(connection); request.signal.removeEventListener('abort', finish) } }
					connection = { controller, close() { if (!closed) { finish(); controller.close() } } }
					state.opened++; state.connections.add(connection)
					request.signal.addEventListener('abort', finish, { once: true })
					// Flush HTTP headers without supplying a data value. The first value
					// remains pending until the test explicitly pushes it.
					controller.enqueue(new TextEncoder().encode(': connected\n\n'))
				},
				cancel() { connection.close() },
			})
			return new Response(body, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } })
		},
		close() { for (const state of sessions.values()) for (const connection of [...state.connections]) connection.close() },
	}
}
