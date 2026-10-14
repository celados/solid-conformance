import { action, createEffect, createMemo, createOptimistic, createOptimisticStore, createSignal, For, refresh, until, Errored, flush, isPending, latest, Loading, Show } from 'solid-js'
import { createRouter, memoryHistory, useIsRouting, useNavigate, type Navigator, type RouteDefinition } from '@solidjs/router'
import { render } from '@solidjs/web'
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 20))
type Probe = { before: string; after: string; pending: boolean; fired: boolean; url?: string }
declare global { var wave5: {navigation: (router: boolean, delay?: number, memoized?: boolean | number) => Promise<Probe>; mount: (value?: number, nested?: boolean, shape?: string) => Promise<Probe>; optimism: (value: number, reverse: boolean) => Promise<{before: string; after: string}>; authority: (kind: string, value: number) => Promise<{answer: number; dom: string}>} }
async function navigation(router: boolean, delay = 30, memoized: boolean | number = false): Promise<Probe> {
 const element = document.createElement('section'); document.body.append(element)
 let release!: (value: { default: RouteDefinition[] }) => void
 const gate = new Promise<{default: RouteDefinition[]}>(resolve => {release = resolve})
 let start!: () => unknown, pending!: () => boolean, fired = false
 const history = memoryHistory()
 const dispose = render(() => {
  function Feedback(props: { pending: boolean }) {
   const [elapsed, setElapsed] = createSignal(false)
   createEffect(() => props.pending, value => {
    setElapsed(false)
    if (!value) return
    const timer = setTimeout(() => {fired = true; setElapsed(true)}, delay)
    return () => clearTimeout(timer)
   })
   return <Show when={props.pending && latest(elapsed)}><b role="status">waiting</b></Show>
  }
  if (router) {
   const Router = createRouter({history, scrollRestoration: false, routes: [{path: '/', component: () => <p>old</p>}, {path: '/slow', component: (props: {children?: import('@solidjs/web').JSX.Element}) => <>{props.children}</>, children: () => gate}]})
   function Shell(props: {children?: import('@solidjs/web').JSX.Element}) {
    const navigate: Navigator = useNavigate(); start = () => navigate('/slow'); pending = useIsRouting()
    return <><Feedback pending={pending()} />{props.children}</>
   }
   return <Router>{props => <Shell>{props.children}</Shell>}</Router>
  }
  const [n, setN] = createSignal(0)
  const data = createMemo(() => n() ? gate.then(() => 'new') : 'old')
  const routing = createMemo(() => memoized === 2 || memoized === 3 ? isPending(() => data()) : isPending(data))
  pending = memoized === 3 ? () => routing() || isPending(n) : memoized ? routing : () => isPending(data)
  start = action(function* () {setN(1); yield gate})
  if (memoized === 4) return <><Feedback pending={isPending(data)} /><p>{data()}</p></>
  if (memoized === 5) {function Shell(props: {children?: import('@solidjs/web').JSX.Element}) {return <><Feedback pending={isPending(data)} />{props.children}</>} return <Shell><p>{data()}</p></Shell>}
  return <><Feedback pending={pending()} /><Loading fallback="initial"><p>{data()}</p></Loading></>
 }, element)
 try {
  await tick(); start(); await new Promise(resolve => setTimeout(resolve, delay + 50)); flush()
  const before = element.textContent ?? '', value = pending(), url = history.get()
  release({default: [{path: '/', component: () => <p>new</p>}]}); await tick(); await tick()
  return {before, after: element.textContent ?? '', pending: value, fired, ...(router ? {url} : {})}
 } finally {release({default: []}); dispose(); element.remove()}
}
async function mount(value = 1, nested = false, shape = 'static'): Promise<Probe> {
 const element = document.createElement('section'); document.body.append(element)
 let release!: () => void, start!: () => Promise<unknown>
 const gate = new Promise<void>(resolve => {release = resolve})
 const dispose = render(() => {
  const [n, setN] = createSignal(0)
  start = action(function* () {setN(value); yield gate})
  const content = () => <Loading fallback="pending"><p>{n()}</p></Loading>
  const branch = () => nested ? <Errored fallback="error">{content()}</Errored> : content()
  return <><i>{n()}</i>{shape === 'function' ? <Show when={latest(n) > 0}>{_value => branch()}</Show> : shape === 'keyed' ? <Show when={latest(n) > 0} keyed>{_value => branch()}</Show> : <Show when={latest(n) > 0}>{branch()}</Show>}</>
 }, element)
 try {
  await tick(); const done = start(); await tick(); flush(); const before = element.textContent ?? ''
  release(); await done; await tick()
  return {before, after: element.textContent ?? '', pending: true, fired: true}
 } finally {release(); dispose(); element.remove()}
}
window.wave5 = {navigation, mount, optimism, authority}
async function optimism(value: number, reverse: boolean) {
 const element = document.createElement('section'); document.body.append(element)
 type Row = {id: number; n: number}
 const initial: Row[] = [{id: 1, n: 0}, {id: 2, n: 0}]
 let source!: (rows: Row[]) => void, release!: () => void, start!: () => Promise<unknown>
 const gate = new Promise<void>(resolve => {release = resolve})
 const dispose = render(() => {
  const [rows, setRows] = createSignal(initial); source = setRows
  const [store, setStore] = createOptimisticStore(() => rows(), initial, {key: 'id'})
  const [saving, setSaving] = createOptimistic(false)
  start = action(function* () {setSaving(true); setStore(draft => {draft[1]!.n = value}); yield gate; yield until(() => store.find(row => row.id === 2)?.n === value, {timeout: 1000})})
  return <><Show when={saving()}>saving</Show><For each={store}>{row => <p>{row.id}:{row.n};</p>}</For></>
 }, element)
 try {
  await tick(); const done = start(); await tick(); const before = element.textContent ?? ''
  const confirmed = [{id: 1, n: 0}, {id: 2, n: value}]
  source(reverse ? confirmed.toReversed() : confirmed); await tick()
  release(); await done; await tick()
  return {before, after: element.textContent ?? ''}
 } finally {release(); dispose(); element.remove()}
}
async function authority(kind: string, value: number) {
 const element = document.createElement('section'); document.body.append(element)
 let answer = 0, start!: () => Promise<unknown>, publish!: () => void, server = 0
 const dispose = render(() => {
  const [source, setSource] = createSignal(0)
  const [guess, setGuess] = createOptimistic(() => kind === 'refresh-derived' ? createSource() : source())
  function createSource() {return server}
  const derived = createMemo(() => guess() * 2)
  publish = () => setSource(value)
  start = action(function* () {setGuess(99); if(kind === 'refresh-derived') {server = value; answer = (yield refresh(guess)) as number} else {yield until(() => derived() === value * 2, {timeout: 1000}); answer = value}})
  return <p>{derived()}</p>
 }, element)
 try {
  await tick(); const done = start(); await tick(); if(kind !== 'refresh-derived') publish(); await done; await tick()
  return {answer, dom: element.textContent ?? ''}
 } finally {dispose(); element.remove()}
}
