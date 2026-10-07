import {test,expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {leaf} from '../../harness/tree'
test('a rejected derived store request reaches Errored',async()=>{
	const h=await openHarness()
	try {const result=await h.run({tree:leaf(),order:[],scenario:'finding:004'},'csr');expect(result.messages).toEqual([]);expect(result.dom).toBe('<b>error</b>')}finally{await h.close()}
},30000)
