import { test, expect } from 'bun:test'

import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
test('a streamed store claims one keyed row without hydration errors', async () => {
	const h = await openHarness()
	try {
		const result = await h.run(
			{ tree: leaf(), order: [], scenario: 'minimal-store' },
			'hydrate',
		)
		expect(
			result.messages.filter(
				(message) =>
					message.startsWith('pageerror:') || message.startsWith('error:'),
			),
		).toEqual([])
		expect(result.dom).toBe('<li>1</li>')
	} finally {
		await h.close()
	}
}, 30000)
