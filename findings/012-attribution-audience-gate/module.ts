import { createRoot, createSignal, createMemo, flush } from 'solid-js'
import { attribution } from 'solid-js/attribution'
export function run() {
	const release = attribution.enable({ log: false, checks: false })
	let dispose!: () => void
	try {
		const write = createRoot(d => {
			dispose = d
			const [read, write] = createSignal(0)
			createMemo(read)
			return write
		})
		write(1); flush()
		return attribution.history('rerun').length
	} finally { dispose(); release() }
}
