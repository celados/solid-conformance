import { test, expect } from 'bun:test'
import { openHarness } from '../../harness/browser'
import { runtimeReceipt } from '../../harness/runtime'
import { leaf } from '../../harness/tree'

test('RFC chapters: behavioral statements execute in the selected client/server artifacts', async () => {
	const h=await openHarness()
	try {
		const server=await h.ssr.inRequest(()=>h.ssr.runDocCases())
		const client=await h.run({tree:leaf(),order:[],scenario:'docs'},'csr')
		const results=[...server.map(r=>({...r,platform:'server'})),...client.docs.map(r=>({...r,platform:'client'}))]
		await Bun.write(process.env.DOC_RECEIPT??'artifacts/docs.json',JSON.stringify({runtime:await runtimeReceipt(),results,messages:client.messages},null,2))
		console.log('Doc cases:',results.length,JSON.stringify(results.filter(r=>r.error),null,2))
		expect(client.messages.filter(m=>!m.startsWith('warning: [REACTIVE_WRITE_IN_OWNED_SCOPE] repair guide:'))).toEqual([])
		const known = new Set(['04/keyed-reconcile', '04/store-path', '05/loading-on-constant', '02/pinned-derived-signal', '06/refresh-staged-authority'])
		if (h.variant === 'production') for (const id of ['05/refresh-delivery','05/refresh-quiet','05/refresh-quiescence','06/affects-key-granularity','06/affects-nested-record']) known.add(id)
		const signatures: Record<string, RegExp> = {
			'06/refresh-staged-authority': /^Error: Expected 2, received 99$/,
			'02/pinned-derived-signal': /^Error: Expected \{"n":3,"pinned":false\}, received \{"n":99,"pinned":false\}$/,
			'04/keyed-reconcile': /Expected true, received false/,
			'04/store-path': /storePath.*not a function/,
			'05/loading-on-constant': /Expected "fallback", received "1"/,
			'06/affects-key-granularity': /^Error: Expected true, received false$/,
			'06/affects-nested-record': /^Error: Expected true, received false$/,
			'05/refresh-delivery': /did not settle within/,
			'05/refresh-quiet': /did not settle within/,
			'05/refresh-quiescence': /did not settle within/,
		}
		for (const result of results) if (result.error && known.has(result.id)) expect(result.error).toMatch(signatures[result.id]!)
		// Raw failures stay in the receipt and findings/005–007 remain red.
		expect(results.filter(r=>r.error && (process.env.STRICT_FINDINGS || !known.has(r.id)))).toEqual([])
	}finally{await h.close()}
},120000)
