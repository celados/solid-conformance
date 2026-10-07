// RFC 09 removals and RFC 01/02/04 forbidden public signatures.
// @ts-expect-error Renderer-neutral core does not export the JSX namespace.
import type { JSX } from 'solid-js'
// @ts-expect-error Legacy JSXElement was removed in favor of Element.
import type { JSXElement } from 'solid-js'
// @ts-expect-error The old runtime import path was removed.
import type { JSX as OldRuntime } from 'solid-js/jsx-runtime'
// @ts-expect-error The old dev runtime import path was removed.
import type { JSX as OldDevRuntime } from 'solid-js/jsx-dev-runtime'
import { createEffect, createSignal, createStore, useContext, createContext } from 'solid-js'
// @ts-expect-error An effect requires separate compute and side-effect functions.
createEffect(() => 1)
const [count, setCount] = createSignal(0)
// @ts-expect-error Signal setters preserve the value type.
setCount('wrong')
const [store, setStore] = createStore({ count: 0 })
// @ts-expect-error Solid 1 setter paths were removed; use a draft.
setStore('count', 1)
// @ts-expect-error A default-less context has a defined value, never undefined.
const undefinedValue: undefined = useContext(createContext<number>())
// @ts-expect-error Intrinsic web attributes reject a number for a button's disabled prop.
const invalidElement = <button disabled={42} />
void [count, store, undefinedValue, invalidElement]
