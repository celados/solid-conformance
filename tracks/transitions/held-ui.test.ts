import {test, expect} from 'bun:test'
import {withClientPage} from '../../harness/client-page'
import {runtimeReceipt} from '../../harness/runtime'
import {heldUiScenarios, fc} from './generator'
test('held UI: delayed feedback, nested mounts, reordered optimism and derived authority', async () => {
 const seed = Number(process.env.SEED ?? 20261008), known: Record<string, number> = {}, observations: unknown[] = []
 await withClientPage('tracks/transitions/wave5-client.tsx', async (page, messages) => {
  await page.waitForFunction(() => !!window.wave5)
  const details = await fc.check(fc.asyncProperty(heldUiScenarios, async scenario => {
   if(scenario.family === 'latest-mount') {
    const result = await page.evaluate(s => window.wave5.mount(s.value, s.nested), scenario)
    observations.push({scenario,result})
    expect(result.after).toBe(`${scenario.value}${scenario.value}`)
    if(result.before === `0${scenario.value}` && !process.env.STRICT_FINDINGS) known['056'] = (known['056'] ?? 0) + 1
    else expect(result.before).toBe('0pending')
   } else if(scenario.family === 'held-navigation' || scenario.family === 'core-feedback') {
    const result = await page.evaluate(s => window.wave5.navigation(s.family === 'held-navigation', s.delay), scenario)
    observations.push({scenario,result})
    expect(result.pending).toBe(true); expect(result.fired).toBe(true); expect(result.after).toBe('new')
    if(result.before === 'old' && scenario.family === 'held-navigation' && !process.env.STRICT_FINDINGS) known['055'] = (known['055'] ?? 0) + 1
    else expect(result.before).toBe('waitingold')
   } else if(scenario.family === 'optimistic-reorder') {
    const result = await page.evaluate(s => window.wave5.optimism(s.value,s.reverse), scenario)
    observations.push({scenario,result})
    expect(result.before).toBe(`saving1:0;2:${scenario.value};`)
    expect(result.after).toBe(scenario.reverse ? `2:${scenario.value};1:0;` : `1:0;2:${scenario.value};`)
   } else {
    const result = await page.evaluate(s => window.wave5.authority(s.family,s.value), scenario)
    observations.push({scenario,result})
    expect(result).toEqual({answer:scenario.value,dom:String(scenario.value*2)})
   }
  }), {seed, numRuns:Number(process.env.HELD_UI_CASES ?? 60)})
  await Bun.write('artifacts/held-ui.json',JSON.stringify({runtime:await runtimeReceipt(),seed,known,observations,failed:details.failed,counterexample:details.counterexample,counterexamplePath:details.counterexamplePath,error:String(details.errorInstance??'')},null,2))
  expect(messages).toEqual([])
  if(details.failed)throw details.errorInstance
 }, undefined, 150000)
}, 180000)
