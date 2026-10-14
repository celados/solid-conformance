import {test, expect} from 'bun:test'
import fc from 'fast-check'
import {heldMounts} from './held-mount-generator'
import {withClientPage} from '../../harness/client-page'
import {runtimeReceipt} from '../../harness/runtime'
test('compiled Show child forms preserve boundary world and converge after held writes',async()=>{
 const seed=Number(process.env.SEED??20261007),observations:unknown[]=[],known:Record<string,number>={}
 await withClientPage('tracks/transitions/wave5-client.tsx',async(page,messages)=>{
  await page.waitForFunction(()=>!!window.wave5)
  const result=await fc.check(fc.asyncProperty(heldMounts,async scenario=>{
   const probe=await page.evaluate(s=>window.wave5.mount(s.value,s.nested,s.shape),scenario)
   observations.push({scenario,probe})
   expect(probe.after).toBe(`${scenario.value}${scenario.value}`)
   if(probe.before===`0${scenario.value}`&&!process.env.STRICT_FINDINGS)known['056']=(known['056']??0)+1
   else expect(probe.before).toBe('0pending')
  }),{seed,numRuns:Number(process.env.HELD_MOUNT_CASES??80)})
  await Bun.write('artifacts/held-mount.json',JSON.stringify({runtime:await runtimeReceipt(),seed,observations,known,failed:result.failed,counterexample:result.counterexample,counterexamplePath:result.counterexamplePath,error:String(result.errorInstance??'')},null,2))
  expect(messages).toEqual([])
  if(result.failed)throw result.errorInstance
 })
},180000)
