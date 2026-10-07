import { createMemo, createOptimistic, Loading, Errored, configureClientErrors } from 'solid-js'
import * as sf from '@solidjs/web/server-functions'
import { isServer, redirect } from '@solidjs/web'
import { createRouter, memoryHistory, query, liveQuery, action, useAction, useSubmissions, useNavigate, usePreloadRoute, useParams, useLocation } from '@solidjs/router'
import { deferred, controlledIterable, ticks } from '../../harness/timing'
import type { DocResult } from '../docs/registry'

export type RouterScenario = 'preload' | 'supersession' | 'action-failure' | 'action-success' | 'redirect' | 'live' | 'query-error' | 'form-success' | 'server-action'
export function routerCase(scenario: RouterScenario, value = 7, reverse = false) {
  const docs: DocResult[] = [], errors: string[] = []
  const gates = Array.from({length: 4}, () => deferred<number>())
  const stream = controlledIterable<number>(); stream.push(0)
  const calls: number[] = [], preloads: string[] = []
  let truth = 0, submitCalls = 0, settled = 0
  let navigate!: ReturnType<typeof useNavigate>, preload!: ReturnType<typeof usePreloadRoute>
  let invoke!: (value: number) => Promise<unknown>, submissions!: ReturnType<typeof useSubmissions>
  let optimism!: () => number
  const mutationGate = deferred<void>()
  const get = query((id: number) => { calls.push(id); return id === 0 ? Promise.resolve(truth) : gates[id]!.promise }, 'wave3-query')
  const guard = query(async () => redirect('/item/0'), 'wave3-guard')
  const live = liveQuery(() => stream.iterable, 'wave3-live')
  const rpc = isServer ? (sf as unknown as typeof import('@solidjs/web/server-functions/server')).createServerReference((sf as unknown as typeof import('@solidjs/web/server-functions/server')).registerServerReference('wave3-router-action', async (n: number) => n)) : (sf as unknown as typeof import('@solidjs/web/server-functions/client')).createServerReference('wave3-router-action')
  const mutation = scenario === 'server-action' ? action(rpc as (n: number) => Promise<number>) : action(async (n: number) => { await mutationGate.promise; truth = n; return n }, 'wave3-mutation')
  if (!isServer) configureClientErrors({onError(error) { errors.push(String(error)) }})
  function Panel() {
    const params = useParams()
    const data = createMemo(() => get(Number(params.id ?? 0)))
    const liveValue = createMemo(() => live())
    const liveValue2 = createMemo(() => live())
    return <Errored fallback={(_e) => <b>query-error</b>}><Loading fallback={<i>pending</i>}><span>{scenario === 'live' ? liveValue() + liveValue2() : data()}</span></Loading></Errored>
  }
  const Router = createRouter({history: memoryHistory('/'), routes: [
    {path: '/', component: Panel},
    {path: '/item/:id', component: Panel, preload: p => {preloads.push(p.intent); void get(Number(p.params.id))}},
    {path: '/guard', component: () => { const v = createMemo(() => guard()); return <Loading fallback={<i>guard</i>}><span>{String(v())}</span></Loading> } },
  ]})
  function App() { return <Router>{p => {
    navigate = useNavigate(); preload = usePreloadRoute(); invoke = useAction(mutation); submissions = useSubmissions(mutation)
    const [overlay, setOverlay] = createOptimistic(0); optimism = overlay
    mutation.onSubmit(n => { submitCalls++; setOverlay(n) }).onSettled(() => { settled++ })
    const location = useLocation()
    return <><a href='/item/1'>next</a><em>{overlay()}</em><small>{submissions.length}</small><output>{location.pathname}</output><form action={mutation.with(value)} method='post'><button type='submit'>save</button></form>{p.children}</>
  }}</Router> }
  function check(id: string, condition: boolean) { docs.push({id: 'router/' + id, file:'solid-router/README.md', statement:id, ...(condition ? {} : {error: 'Invariant failed: ' + id})}) }
  async function wait() { await ticks(16) }
  const content = () => document.querySelector('#root')!.textContent!
  return {App, docs, streams: [stream], async settle() {
    if (isServer) return
    await wait()
    check('initial-query-render', content().endsWith('0'))
    if (scenario === 'preload') {
      const old = calls.filter(v => v === 1).length
      preload('/item/1', {preloadData: true}); await wait()
      check('preload-starts-query', calls.filter(v => v === 1).length === old + 1)
      gates[1]!.resolve(value); await wait(); document.querySelector<HTMLAnchorElement>('a')!.click(); await wait()
      check('preload-navigation-dedupes', calls.filter(v => v === 1).length === old + 1)
      check('preload-intent-recorded', preloads.includes('preload'))
      check('preloaded-result-rendered', content().endsWith(String(value)))
    } else if (scenario === 'supersession') {
      navigate('/item/1'); await wait(); navigate('/item/2'); await wait()
      if(reverse) { gates[2]!.resolve(value); await wait(); gates[1]!.resolve(101) }
      else { gates[1]!.resolve(101); await wait(); check('superseded-result-never-rendered', !content().endsWith('101')); gates[2]!.resolve(value) }
      await wait(); check('superseded-navigation-never-wins', content().endsWith(String(value)) && !content().endsWith('101'))
      check('latest-location-wins', document.querySelector('output')!.textContent === '/item/2')
    } else if (scenario.startsWith('action') || scenario === 'form-success' || scenario === 'server-action') {
      const done = scenario === 'form-success' ? (document.querySelector<HTMLFormElement>('form')!.requestSubmit(), Promise.resolve()) : invoke(value).catch(e => e)
      await wait(); check('onSubmit-once', submitCalls === 1); check('optimistic-overlay-visible', optimism() === value)
      check('pending-is-not-submission-history', submissions.length === 0)
      if(scenario === 'form-success') check('form-busy-while-pending', document.querySelector('form')!.getAttribute('aria-busy') === 'true')
      if(scenario === 'action-failure') mutationGate.reject(new Error('mutation-failed')); else mutationGate.resolve()
      if(scenario === 'server-action') await fetch('/router-release')
      await done; await wait()
      check('optimistic-overlay-reverted', optimism() === 0); check('onSettled-once', settled === 1)
      check('settled-history-once', submissions.length === 1)
      check('submission-result-or-error', scenario === 'action-failure' ? String(submissions[0]!.error).includes('mutation-failed') : submissions[0]!.result === value)
      if(scenario === 'form-success') check('form-busy-cleared-on-settle', !document.querySelector('form')!.hasAttribute('aria-busy'))
      if(scenario !== 'action-failure' && scenario !== 'server-action') check('query-revalidated-after-action', content().endsWith(String(value)))
    } else if(scenario === 'redirect') {
      navigate('/guard'); await wait(); check('query-redirect-replaces-navigation', document.querySelector('output')!.textContent === '/item/0')
      check('redirect-is-not-rendered-as-data', !content().includes('[object Response]'))
    } else if(scenario === 'live') {
      check('live-key-has-one-connection', stream.stats.opened === 1)
      stream.push(value); await wait(); check('live-both-consumers-update', content().endsWith(String(value * 2)))
    } else if(scenario === 'query-error') {
      void gates[1]!.promise.catch(() => {})
      navigate('/item/1'); await wait(); gates[1]!.reject(new Error('query-failed')); await wait()
      check('query-error-nearest-boundary', content().endsWith('query-error')); check('query-error-reported-once', errors.length === 1)
    }
    check('no-unexpected-source-errors', scenario === 'query-error' ? errors.length === 1 : errors.length === 0)
  }}
}
