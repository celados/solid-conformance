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
