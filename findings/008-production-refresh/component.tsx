import { createMemo, resolve, refresh, createSignal } from 'solid-js'
export function refreshCase() {
	let read!: ReturnType<typeof createMemo<number>>, write!: (value: string) => void
	function App() {
		let calls = 0
		read = createMemo(() => Promise.resolve(++calls))
		const [result, set] = createSignal('waiting'); write = set
		return <span>{result()}</span>
	}
	return { App, streams: [], async settle() {
		await resolve(read)
		let timer: ReturnType<typeof setTimeout> | undefined
		try { write(String(await Promise.race([refresh(read), new Promise(res => { timer = setTimeout(() => res('timeout'), 200) })]))) }
		finally { clearTimeout(timer) }
	} }
}
