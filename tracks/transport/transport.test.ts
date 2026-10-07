import { test, expect } from 'bun:test'
import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
import { controlledSSE } from './server'
import type { TransportEvent, TransportSpec } from './component'
import fc from 'fast-check'
import { runtimeReceipt } from '../../harness/runtime'

test('real SSE: slow first value, peer drop/reconnect, request supersession, pending disposal and terminal errors', async()=>{
	const transport=controlledSSE(), h=await openHarness(undefined,false,transport)
	const receipt:{primitive:string;mode:string;events:TransportEvent[];trace:unknown}[]=[]
	async function run(primitive:TransportSpec['primitive'],events:TransportEvent[],mode:'csr'|'hydrate'){
		console.log('SSE case',primitive,mode,JSON.stringify(events))
		const result=await h.run({tree:leaf(),order:[],transport:{primitive,events}},mode)
		expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([])
		for(const s of [...result.stats,...result.serverStats])expect(s.opened).toBe(s.closed)
		const trace=result.trace as unknown as {kind:string;dom:string;errors:number;opened:number;closed:number}[]
		const last=trace.at(-2)!
		if(events.some(e=>e.kind==='error')){expect(last.dom).toContain('<b>terminal-source-error</b>');expect(last.errors).toBe(1)}
		else{const final=events.findLast(e=>e.kind==='push');expect(last.dom).toContain(`<span>${final?.value}</span>`);expect(last.errors).toBe(0)}
		const opening=trace[0]!
		expect(opening.opened).toBe(1);expect(opening.closed).toBe(0)
		if(mode==='csr')expect(opening.dom).toContain('pending')
		for(let i=1;i<trace.length;i++)if(trace[i]!.kind==='drop')expect(trace[i]!.opened).toBe(trace[i-1]!.opened+1)
		const closed=trace.at(-1)!;expect(closed.closed).toBe(closed.opened)
		receipt.push({primitive,mode,events,trace})
	}
	try{
		const sequences:TransportEvent[][]=[
			[{kind:'drop'},{kind:'push',value:1},{kind:'click'},{kind:'drop'},{kind:'push',value:2}],
			[{kind:'mount',visible:false},{kind:'mount',visible:true},{kind:'push',value:3}],
			[{kind:'push',value:1},{kind:'argument',value:1},{kind:'push',value:4}],
		]
		for(const primitive of ['memo','store','projection','optimistic-store'] as const)for(const mode of ['csr','hydrate'] as const)for(const events of sequences)await run(primitive,events,mode)
		for(const primitive of ['memo','store','projection','optimistic-store'] as const)for(const mode of ['csr','hydrate'] as const)for(const beforeFirst of [true,false])await run(primitive,beforeFirst?[{kind:'error'}]:[{kind:'push',value:1},{kind:'error'}],mode)
		const arb=fc.record({value:fc.integer({min:1,max:9}),drops:fc.integer({min:0,max:3}),mode:fc.constantFrom('csr' as const,'hydrate' as const)})
		await fc.assert(fc.asyncProperty(arb,async s=>{const events:TransportEvent[]=[{kind:'push',value:s.value}];for(let i=0;i<s.drops;i++)events.push({kind:'drop'},{kind:'click'},{kind:'push',value:s.value+i+1});await run('memo',events,s.mode)}),{seed:20261009,numRuns:Number(process.env.TRANSPORT_CASES??20)})
	}finally{
		await Bun.write(process.env.TRANSPORT_RECEIPT??'artifacts/transport.json',JSON.stringify({runtime:await runtimeReceipt(),checked:receipt.length,cases:receipt},null,2))
		await h.close();transport.close()
	}
},300000)
