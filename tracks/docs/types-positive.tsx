// RFC 09: renderer-neutral APIs use Element; web JSX is owned by @solidjs/web.
import type { Element, Component, ParentComponent } from 'solid-js'
import type { ComponentProps, JSX } from '@solidjs/web'
import type { JSX as RuntimeJSX } from '@solidjs/web/jsx-runtime'
import type { JSX as DevelopmentJSX } from '@solidjs/web/jsx-dev-runtime'
import { createSignal, createEffect, createMemo, createStore, createProjection, createContext, useContext, action, isEqual, getObserver, mapArray, createOptimistic, createOptimisticStore } from 'solid-js'
const App: Component = () => 'hello'
const Layout: ParentComponent = props => props.children
const neutral: Element = App({})
const button: ComponentProps<'button'> = { type: 'button', disabled: true }
const click: JSX.EventHandler<HTMLButtonElement, MouseEvent> = event => { event.currentTarget.disabled = true }
const webElement: RuntimeJSX.Element = <button {...button} onClick={click}>{neutral}</button>
const devElement: DevelopmentJSX.Element = webElement
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)
createEffect(doubled, value => { console.info(value) })
const [store, setStore] = createStore({ value: 0 })
setStore(draft => { draft.value = 2 })
const projection = createProjection(draft => { draft.value = count() }, { value: 0 })
const context = createContext<number>()
const value: number = useContext(context)
const mutate = action(function* (next: number) { setCount(next); yield Promise.resolve(); return next })
const result: Promise<number> = mutate(1)
void [Layout, devElement, projection, store, value, result]

// 05-async-data.md: computation options accept ssrSource and deferStream; loadingValue is T.
const options = { ssrSource: 'hybrid', deferStream: true, loadingValue: 0 } as const
const asyncMemo = createMemo(() => Promise.resolve(1), options)
const asyncSignal = createSignal(() => Promise.resolve(1), options)
const asyncOptimistic = createOptimistic(() => Promise.resolve(1), options)
const asyncStore = createStore(() => Promise.resolve({ n: 1 }), { n: 0 }, { ssrSource: 'server', deferStream: true, seedLoadingValue: true })
const asyncProjection = createProjection(() => Promise.resolve({ n: 1 }), { n: 0 }, { ssrSource: 'client', deferStream: true, seedLoadingValue: true })
const asyncOptimisticStore = createOptimisticStore(() => Promise.resolve({ n: 1 }), { n: 0 }, { ssrSource: 'hybrid', deferStream: true, seedLoadingValue: true })
createEffect(() => Promise.resolve(1), () => {}, options)
const asyncNumber: number = asyncMemo()
void [asyncSignal, asyncOptimistic, asyncStore, asyncProjection, asyncOptimisticStore, asyncNumber]

// MIGRATION.md quick rename map: isEqual, getObserver and mapArray are public replacements.
const same = isEqual({ n: 1 }, { n: 1 })
const observer = getObserver()
const rows = mapArray(() => [1, 2], (value, index) => value() + index, { keyed: false })
void [same, observer, rows]

// RFC 08 L803/L902: seven runtime and ten attribution record augmentations share one OBSERVE import.
import { OBSERVE } from 'solid-js'
import type {} from '@solidjs/web/server-functions'
import type {} from '@solidjs/web/frames'
const observe = OBSERVE!
observe.records.subscribe('rerun', e => { const id: number = e.nodeId; void id })
observe.records.subscribe('create', e => { const count: number = e.depCount; void count })
observe.records.subscribe('effect', e => { const run: number | undefined = e.run; void run })
observe.records.subscribe('flush', e => { const held: boolean = e.held; void held })
observe.records.subscribe('flight', e => { const outcome: 'landed' | 'abandoned' = e.outcome; void outcome })
observe.records.subscribe('fallback', e => { const duration: number = e.shownMs; void duration })
observe.records.subscribe('interaction', e => { const duration: number | undefined = e.settledMs; void duration })
observe.records.subscribe('hold', e => { const duration: number = e.holdMs; void duration })
observe.records.subscribe('navigation', e => { const count: number = e.writes; void count })
observe.records.subscribe('graph', e => { const count: number = e.owners; void count })
observe.records.subscribe('boundary', (e,live) => { const outcome: 'settled' | 'fallback' | 'client' | 'error' = e.outcome; void [outcome,live.error] })
observe.records.subscribe('recovery', e => { const duration: number = e.renderMs; void duration })
observe.records.subscribe('invocation', (e,live) => { const direct: boolean = e.direct; void [direct,live.args] })
observe.records.subscribe('render', (e,live) => { const mode: 'string' | 'stream' = e.mode; void [mode,live.trace] })
observe.records.subscribe('call', (e,live) => { const method: 'GET' | 'POST' = e.method; void [method,live.response] },{bodies:true})
observe.records.subscribe('request', (e,live) => { const side: 'client' = e.side; void [side,live.request] },{bodies:true})
observe.records.subscribe('frame', e => { const count: number = e.slots; void count })
observe.server.trace.provide(request => ({ sampled: !!request, entries: { vendor: 'trace' } }))

// MIGRATION.md import ownership: old subpaths became independent renderer packages.
import h from '@solidjs/h'
import html from '@solidjs/html'
import { createRenderer } from '@solidjs/universal'
void [h, html, createRenderer]
createMemo(() => 1, { transparent: true })
createEffect(() => 1, () => {}, { transparent: true })
// RFC08 L773–780: declared categories and optional owner/node/context fields.
import type {DiagnosticKind,DiagnosticEvent} from 'solid-js'
const kinds:DiagnosticKind[]=['strict-read','async','write','lifecycle','owner','error','perf','graph','responsiveness']
const minimalDiagnostic:DiagnosticEvent={sequence:1,code:'NO_OWNER_CLEANUP',kind:'lifecycle',severity:'info',message:'advisory'}
const locatedDiagnostic:DiagnosticEvent={...minimalDiagnostic,ownerId:'owner',ownerName:'App',ownerPath:['<App>','effect'],nodeName:'count',data:{value:1}}
// @ts-expect-error Severity is the documented finite union.
const forbiddenSeverity:DiagnosticEvent={...minimalDiagnostic,severity:'fatal'}
// @ts-expect-error A record does not contain its live subject.
const forbiddenLive:DiagnosticEvent={...minimalDiagnostic,subject:{}}
void[kinds,minimalDiagnostic,locatedDiagnostic,forbiddenSeverity,forbiddenLive]
