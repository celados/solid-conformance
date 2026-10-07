import {test, expect} from 'bun:test'
import {openHarness} from '../../harness/browser'
import {runtimeReceipt} from '../../harness/runtime'
import {leaf} from '../../harness/tree'
import {fc, routerOperations} from './generator'
import type {RouterScenario} from './router-case'
function canonicalHTML(html: string) { return html.replace(/<(\w+)([^>]*)>/g, (_match, tag: string, attrs: string) => '<'+tag+(attrs.match(/[\w:-]+(?:="[^"]*")?/g)?.sort().map((a: string) => ' '+a).join('') ?? '')+'>') }
const scenarios: RouterScenario[] = ['preload', 'supersession', 'action-failure', 'action-success', 'redirect', 'live', 'query-error', 'form-success', 'server-action']
test('router next: navigation, preload, keyed sources, submissions, redirects and boundaries', async () => {
  let service: typeof import('../../harness/server') | undefined
  let posts = 0
  const h = await openHarness(undefined,false,{async fetch(request) { if(new URL(request.url).pathname === '/router-release') return service!.releaseRouterRPC(); if(new URL(request.url).pathname.startsWith('/_server')) { if(request.method === 'POST') posts++; return service!.handleRouterRPC(request) } }})
  service = h.ssr
  const results: unknown[] = []
  let generated = 0
  try {
    for(const scenario of scenarios) for(const mode of ['csr', 'hydrate'] as const) {
      console.log('Router', scenario, mode)
      const result = await h.run({tree:leaf('text',7),order:[1],scenario:'router:'+scenario},mode)
      results.push({scenario,mode,...result})
      expect(result.messages).toEqual([]); expect(result.serverErrors).toEqual([])
      expect(result.docs.filter(d => d.error)).toEqual([])
      for(const stat of [...result.stats,...result.serverStats]) expect(stat.closed).toBe(stat.opened)
    }
    expect(posts).toBeGreaterThanOrEqual(2)
    await fc.assert(fc.asyncProperty(routerOperations, async operation => {
      generated++
      const spec = {tree:leaf('text',operation.value),order:[operation.reverse ? 1 : 0],scenario:'router:'+operation.family}
      const a = await h.run(spec,'csr'), b = await h.run(spec,'hydrate')
      results.push({operation,csr:a,hydrate:b})
      for(const r of [a,b]) { expect(r.messages).toEqual([]); expect(r.serverErrors).toEqual([]); expect(r.docs.filter(d=>d.error)).toEqual([]); for(const stat of [...r.stats,...r.serverStats]) expect(stat.closed).toBe(stat.opened) }
      expect(canonicalHTML(b.dom)).toBe(canonicalHTML(a.dom))
    }), {numRuns:Number(process.env.ROUTER_CASES ?? 20),seed:Number(process.env.SEED ?? 20261009)})
  } finally { await Bun.write(process.env.ROUTER_RECEIPT ?? 'artifacts/router.json', JSON.stringify({runtime:await runtimeReceipt(),spine:scenarios.length,generated,posts,browserRuns:18+generated*2,results},null,2)); await h.close() }
},600000)
