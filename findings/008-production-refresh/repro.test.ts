import { test, expect } from 'bun:test'
import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
test('05-async-data.md: production refresh resolves its next value', async () => {
	const h = await openHarness()
	try { const result = await h.run({ tree: leaf(), order: [], scenario: 'finding:008' }, 'csr'); expect(result.messages).toEqual([]); expect(result.dom).toBe('<span>2</span>') }
	finally { await h.close() }
}, 30000)
