import { test, expect } from 'bun:test'
import { build, type BuildMode } from '../../scripts/build'
import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
test('RFC 08 L1121 audience gating and L1133–1137 values contract in fresh dev/observe/prod engines',async()=>{
	for(const variant of ['development','observe','production'] as BuildMode[]){
		const directory=resolve('.build','attribution-isolation-'+process.pid+'-'+variant)
		try{
			await build(directory,variant,{client:['tracks/docs/attribution-probe.ts'],server:[]})
			const runner='const m=await import(process.argv[1]);console.log(JSON.stringify({probe:m.probe(),defaults:m.privacy(),labels:m.privacy("labels"),strict:m.privacy("full","none"),contracts:await m.contracts()}))'
			const child=Bun.spawn(['bun','-e',runner,directory+'/attribution-probe.js'],{stdout:'pipe',stderr:'pipe'})
			const output=await new Response(child.stdout).text(),error=await new Response(child.stderr).text()
			expect(await child.exited).toBe(0);expect(error).toBe('')
			const receipt=JSON.parse(output)
			if(variant==='production'){expect(receipt.probe).toEqual({unobserved:0,observed:0,afterUnsubscribe:0,records:0,installed:false});expect(receipt.defaults).toEqual([]);continue}
			// Finding 012: the public barrel registers folds even with no audience.
			// STRICT_FINDINGS restores the documented empty-history oracle.
			expect(receipt.probe).toEqual(variant!=='development'||process.env.STRICT_FINDINGS?{unobserved:0,observed:1,afterUnsubscribe:1,records:1,installed:true}:{unobserved:1,observed:2,afterUnsubscribe:3,records:1,installed:true})
			expect(receipt.defaults.map((r:any)=>r.preview)).toEqual([variant==='development',variant==='development',variant==='development'])
			expect(receipt.defaults.map((r:any)=>r.target)).toEqual(variant==='development'?['button#save "Save"','div#card "Personal note"','div#card "Personal note"']:['button#save','div#card','div#card'])
			expect(receipt.labels.map((r:any)=>r.preview)).toEqual([false,false,false]);expect(receipt.labels.map((r:any)=>r.target)).toEqual(['button#save "Save"','div#card','div#card'])
			expect(receipt.strict.map((r:any)=>r.preview)).toEqual([false,false,true]);expect(receipt.strict.map((r:any)=>r.target)).toEqual(['button#save','div#card','div#card "Personal note"'])
			// RFC 08 L1131/L1143–1154: source previews and the public cause-chain origin kinds.
			const contracts=receipt.contracts,causes=contracts.flatMap((r:any)=>r.causes)
			expect(causes.some((c:any)=>c.origin?.kind==='action')).toBe(true);expect(causes.some((c:any)=>c.origin?.kind==='effect')).toBe(true);expect(causes.some((c:any)=>c.origin?.kind==='async')).toBe(true);expect(causes.some((c:any)=>c.origin?.kind==='external')).toBe(true)
			expect(causes.some((c:any)=>String(c.name).startsWith('store.'))).toBe(true)
			const values=causes.map((c:any)=>c.value);expect(values).toContain('Array(2)');expect(values).toContain('[Object]');expect(values).toContain('true');expect(values).toContain('12')
			expect(causes.find((c:any)=>c.value==='\"escaped-action\"')?.origin?.kind).toBe(process.env.STRICT_FINDINGS?'async':'external');expect(values).toContain('\"'+'x'.repeat(40)+'…\"')
			const previewScopes=contracts.filter((r:any)=>r.name==='preview-reader');expect(new Set(previewScopes.map((r:any)=>r.nodeId)).size).toBe(1)
		}finally{await rm(directory,{recursive:true,force:true})}
	}
},30000)
