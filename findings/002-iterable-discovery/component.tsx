import { createMemo, Loading } from 'solid-js'
export function iterableDiscoveryCase() {
	function Child() {
		const value = createMemo(() =>
			(async function* () {
				yield 'v'
			})(),
		)
		const now = value()
		return <p>{now}</p>
	}
	return () => (
		<Loading>
			<Child />
		</Loading>
	)
}
