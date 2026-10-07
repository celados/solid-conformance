import { lazy, Loading, Errored } from 'solid-js'

import { ticks } from '../../harness/timing'
export function lazyCase(placement: string) {
	const Part = lazy(
		() => import('../../harness/lazy-part'),
		undefined,
		placement === 'missing' ? 'missing.tsx' : 'harness/lazy-part.tsx',
	)
	function App() {
		if (placement === 'root' || placement === 'missing')
			return <Part value={1} />
		if (placement === 'nested')
			return (
				<Loading>
					<Loading>
						<Part value={1} />
					</Loading>
				</Loading>
			)
		return (
			<Errored fallback={(e) => <b>{String(e())}</b>}>
				<Loading>
					<Part value={1} />
				</Loading>
			</Errored>
		)
	}
	return { App, streams: [], settle: () => ticks(8) }
}
