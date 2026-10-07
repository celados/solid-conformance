import {test,expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {fc} from './generator'
test('README: router instance match is pure; optional, wildcard and filtered params match without rendering', async () => {
  const h = await openHarness()
  let cases = 0
  try {
    fc.assert(fc.property(fc.integer({min:0,max:100000}), n => {
      cases++
      expect(h.ssr!.runRouterMatching(n)).toEqual([String(n),0,1,String(n),'a/b',String(n),'/users/'+n])
    }),{numRuns:Number(process.env.MATCH_CASES ?? 1000),seed:20261009})
    console.log({routerMatchCases:cases})
  } finally {await h.close()}
},30000)
