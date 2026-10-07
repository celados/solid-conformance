import {test,expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {leaf} from '../../harness/tree'
test('03-control-flow.md L202: adopted async dynamic source is not re-run on hydration',async()=>{
 const h=await openHarness()
 try{for(const mode of ['csr','hydrate']as const){const result=await h.run({tree:leaf(),order:[],scenario:'doc-policy:dynamic-count-only'},mode);expect(result.dom).toBe('<article></article>');expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([]);const calls=(result.docs[0]as unknown as{observations:{calls:number}}).observations.calls;expect(calls).toBe(mode==='csr'?1:0)}}finally{await h.close()}
},30000)
