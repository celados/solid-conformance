import {test,expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {leaf,wrap} from '../../harness/tree'
import {runtimeReceipt} from '../../harness/runtime'
import {fc,routerTransitions} from './generator'
const families=['preload','supersession','action-failure','action-success','redirect','live','query-error','form-success','server-action'] as const
const canonical=(s:string)=>s.replace(/<(\w+)([^>]*)>/g,(_m,tag,attrs)=>'<'+tag+(attrs.match(/[\w:-]+(?:="[^"]*")?/g)?.sort().map((a:string)=>' '+a).join('')??'')+'>')
test('router transition generator: preload query/action/submission/redirect/live interleavings preserve hydration, wrappers and settle orders',async()=>{
 let service:typeof import('../../harness/server')|undefined;const h=await openHarness(undefined,false,{fetch:r=>new URL(r.url).pathname==='/router-release'?service!.releaseRouterRPC():new URL(r.url).pathname.startsWith('/_server')?service!.handleRouterRPC(r):undefined});service=h.ssr
 let attempts=0,browserRuns=0;const counts:Record<string,number>={};const seed=Number(process.env.SEED??20261010)
 async function check(operation:{family:string,value:number,reverse:boolean}){
  attempts++;counts[operation.family]=(counts[operation.family]??0)+1
  const spec={tree:leaf('text',operation.value),order:[operation.reverse?1:0],scenario:'router:'+operation.family}
  const base=await h.run(spec,'csr');browserRuns++
  for(const result of [base]){expect(result.docs.filter(d=>d.error)).toEqual([]);expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([]);for(const stat of [...result.stats,...result.serverStats])expect(stat.closed).toBe(stat.opened)}
  for(const kind of ['base','loading','show','reverse'] as const){const result=await h.run({...spec,tree:kind==='loading'||kind==='show'?wrap(kind,spec.tree):spec.tree,order:kind==='reverse'?[operation.reverse?0:1]:spec.order},kind==='reverse'?'csr':'hydrate');browserRuns++;expect(result.docs.filter(d=>d.error)).toEqual([]);expect(result.messages).toEqual([]);expect(result.serverErrors).toEqual([]);for(const stat of [...result.stats,...result.serverStats])expect(stat.closed).toBe(stat.opened);expect(canonical(result.dom)).toBe(canonical(base.dom))}
 }
 try{for(const family of families)await check({family,value:7,reverse:true});const details=await fc.check(fc.asyncProperty(routerTransitions,check),{numRuns:Number(process.env.ROUTER_TRANSITION_CASES??20),seed});await Bun.write(process.env.ROUTER_TRANSITION_RECEIPT??'artifacts/router-transitions.json',JSON.stringify({runtime:await runtimeReceipt(),seed,spine:families.length,generated:details.numRuns,attempts,browserRuns,counts,failed:details.failed,counterexample:details.counterexample,counterexamplePath:details.counterexamplePath,error:String(details.errorInstance??'')},null,2));if(details.failed)throw details.errorInstance}finally{await h.close()}
},600000)
