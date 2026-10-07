// RFC 09: renderer-neutral APIs use Element; web JSX is owned by @solidjs/web.
import type { Element, Component, ParentComponent } from 'solid-js'
import type { ComponentProps, JSX } from '@solidjs/web'
import type { JSX as RuntimeJSX } from '@solidjs/web/jsx-runtime'
import type { JSX as DevelopmentJSX } from '@solidjs/web/jsx-dev-runtime'
import { createSignal, createEffect, createMemo, createStore, createProjection, createContext, useContext, action } from 'solid-js'
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
