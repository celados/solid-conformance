// RFC 09 removals and RFC 01/02/04 forbidden public signatures.
// @ts-expect-error Renderer-neutral core does not export the JSX namespace.
import type { JSX } from 'solid-js'
// @ts-expect-error Legacy JSXElement was removed in favor of Element.
import type { JSXElement } from 'solid-js'
// @ts-expect-error The old runtime import path was removed.
import type { JSX as OldRuntime } from 'solid-js/jsx-runtime'
// @ts-expect-error The old dev runtime import path was removed.
import type { JSX as OldDevRuntime } from 'solid-js/jsx-dev-runtime'
import { createEffect, createMemo, createSignal, createStore, useContext, createContext } from 'solid-js'
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
// RFC 01 / MIGRATION removals are absent from the public core declarations.
// @ts-expect-error Default batching replaced batch.
import { batch } from 'solid-js'
// @ts-expect-error Split effects replaced createComputed.
import { createComputed } from 'solid-js'
// @ts-expect-error onSettled replaced onMount.
import { onMount } from 'solid-js'
// @ts-expect-error Split effects do not require the old on helper.
import { on } from 'solid-js'
// @ts-expect-error Errored replaced onError/catchError.
import { onError, catchError } from 'solid-js'
// @ts-expect-error Async computations replaced createResource.
import { createResource } from 'solid-js'
// @ts-expect-error For with keyed=false replaced Index.
import { Index } from 'solid-js'
// @ts-expect-error Reactive class replaces classList.
const oldClass = <div classList={{ active: true }} />
// @ts-expect-error Memo options replaced the old initialValue argument.
createMemo(() => 1, 0)
// RFC 07: lowercase on* properties and removed namespaces are not JSX event APIs.
// @ts-expect-error Lowercase onclick is intentionally not declared by the JSX types.
const lowercaseEvent = <button onclick={() => {}} />
// @ts-expect-error Native event namespaces were removed.
const namespacedEvent = <button on:click={() => {}} />
// @ts-expect-error The use directive namespace was removed.
const directive = <div use:tooltip />
