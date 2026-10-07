import {test,expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {leaf} from '../../harness/tree'
test('05-async-data.md: zero-argument Loading on accessor is tracked',async()=>{
	const h=await openHarness(undefined, true)
	try{const result=await h.run({tree:leaf(),order:[],scenario:'finding:007'},'csr');expect(result.messages).toEqual([]);expect(result.dom).toBe('<b>fallback</b>')}finally{await h.close()}
},30000)
