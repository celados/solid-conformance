import { test, expect } from 'bun:test'
import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
import { runtimeReceipt } from '../../harness/runtime'

test('05-async-data.md: live SSR policy, transparent ID parity and tracking fake-fetch contracts in real Chrome',async()=>{
 const h=await openHarness();const results=[]
 try{for(const kind of ['server','hybrid-promise','hybrid-iterable','client','declared-client','transparent','tracking-fetch','tracking-await','cached-fake'])for(const mode of ['csr','hydrate'] as const){
  const result=await h.run({tree:leaf(),order:[],scenario:'doc-policy:'+kind},mode)
  expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([])
  expect(result.dom).toBe('<span>'+((kind==='server'||kind==='hybrid-promise'||kind==='hybrid-iterable'||kind==='transparent')?'8':'7')+'</span>')
  expect(result.stats.every(s=>s.closed===s.opened)).toBe(true)
  results.push({kind,mode,dom:result.dom,docs:result.docs})
 }await Bun.write(process.env.POLICY_RECEIPT??'artifacts/policies.json',JSON.stringify({runtime:await runtimeReceipt(),results},null,2))}finally{await h.close()}
},120000)
