import { test, expect } from 'bun:test'
import { openHarness } from '../../harness/browser'
import { leaf } from '../../harness/tree'
import { ticks } from '../../harness/timing'
import { runtimeReceipt } from '../../harness/runtime'

test('05-async-data.md: live SSR policy, transparent ID parity and tracking fake-fetch contracts in real Chrome',async()=>{
 const h=await openHarness();const results=[]
 try{for(const kind of ['server','hybrid-promise','hybrid-iterable','client','declared-client','transparent','unowned-auto','idless-auto','tracking-fetch','tracking-await','cached-fake','cached-safe','cached-safe-seed','client-only-eager','client-only-lazy','dynamic-native','dynamic-native-defer','dynamic-native-sync',...['memo','signal','store','projection','optimistic','optimisticstore','effect'].flatMap(p=>['server','hybrid','client'].map(s=>'primitive-'+p+'-'+s))])for(const mode of ['csr','hydrate'] as const){
  const result=await h.run({tree:leaf(),order:[],scenario:'doc-policy:'+kind},mode)
  expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([])
  expect(result.dom).toBe(kind.startsWith('dynamic-native')?'<section id="chosen">chosen</section>':kind.startsWith('client-only')?'<span>loaded</span><i>stable sibling</i>':'<span>'+((kind.startsWith('cached-safe')&&mode==='hydrate')?'99':(kind.startsWith('primitive-')||kind==='server'||kind==='hybrid-promise'||kind==='hybrid-iterable'||kind==='transparent'||kind==='unowned-auto'||kind==='idless-auto')?'8':'7')+'</span>')
  expect(result.stats.every(s=>s.closed===s.opened)).toBe(true)
  results.push({kind,mode,dom:result.dom,docs:result.docs})
 }await Bun.write(process.env.POLICY_RECEIPT??'artifacts/policies.json',JSON.stringify({runtime:await runtimeReceipt(),results},null,2))}finally{await h.close()}
},120000)


test('03-control-flow.md L220/L222: dynamic sync sources write no async hydration record; pending sources stream, deferStream holds the first flush',async()=>{
 const h=await openHarness()
 try{for(const kind of ['dynamic-native','dynamic-native-defer','dynamic-native-sync']){const run=h.ssr.stream({tree:leaf(),order:[],scenario:'doc-policy:'+kind});const chunks:string[]=[];let complete!:()=>void;const end=new Promise<void>(resolve=>{complete=resolve});run.output.pipe({write:chunk=>{chunks.push(chunk)},end:()=>complete()});await ticks(3);if(kind.endsWith('defer'))expect(chunks).toEqual([]);else expect(chunks.join('')).toContain(kind.endsWith('sync')?'<article':'fallback');await run.settle();await end;const html=chunks.join('');expect(run.errors).toEqual([]);expect(html).toContain('<article');expect(html.includes('"article"')).toBe(!kind.endsWith('sync'));if(kind==='dynamic-native')expect(html).toContain('<template id=') }}finally{await h.close()}
},30000)
