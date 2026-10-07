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

// 05-async-data.md: the placeholder must be shaped like the real answer.
// @ts-expect-error Invalid hydration policy spelling is forbidden.
createMemo(() => 1, { ssrSource: 'browser' })
// @ts-expect-error The loadingValue has the same type as the async computation's answer.
createMemo(() => Promise.resolve({ n: 1 }), { loadingValue: { wrong: 0 } })

// MIGRATION.md quick removal map: each forbidden import gets an independent negative assertion.
// @ts-expect-error mergeProps is not part of the Solid 2 public API.
import { mergeProps } from 'solid-js'
// @ts-expect-error splitProps is not part of the Solid 2 public API.
import { splitProps } from 'solid-js'
// @ts-expect-error createSelector is not part of the Solid 2 public API.
import { createSelector } from 'solid-js'
// @ts-expect-error unwrap is not part of the Solid 2 public API.
import { unwrap } from 'solid-js'
// @ts-expect-error Suspense is not part of the Solid 2 public API.
import { Suspense } from 'solid-js'
// @ts-expect-error SuspenseList is not part of the Solid 2 public API.
import { SuspenseList } from 'solid-js'
// @ts-expect-error ErrorBoundary is not part of the Solid 2 public API.
import { ErrorBoundary } from 'solid-js'
// @ts-expect-error equalFn is not part of the Solid 2 public API.
import { equalFn } from 'solid-js'
// @ts-expect-error getListener is not part of the Solid 2 public API.
import { getListener } from 'solid-js'
// @ts-expect-error startTransition is not part of the Solid 2 public API.
import { startTransition } from 'solid-js'
// @ts-expect-error useTransition is not part of the Solid 2 public API.
import { useTransition } from 'solid-js'
// @ts-expect-error produce is not part of the Solid 2 public API.
import { produce } from 'solid-js'
// @ts-expect-error createMutable is not part of the Solid 2 public API.
import { createMutable } from 'solid-js'
// @ts-expect-error modifyMutable is not part of the Solid 2 public API.
import { modifyMutable } from 'solid-js'
// @ts-expect-error from is not part of the Solid 2 public API.
import { from } from 'solid-js'
// @ts-expect-error observable is not part of the Solid 2 public API.
import { observable } from 'solid-js'
// @ts-expect-error createDeferred is not part of the Solid 2 public API.
import { createDeferred } from 'solid-js'
// @ts-expect-error indexArray is not part of the Solid 2 public API.
import { indexArray } from 'solid-js'
// @ts-expect-error resetErrorBoundaries is not part of the Solid 2 public API.
import { resetErrorBoundaries } from 'solid-js'
// @ts-expect-error enableScheduling is not part of the Solid 2 public API.
import { enableScheduling } from 'solid-js'
// @ts-expect-error writeSignal is not part of the Solid 2 public API.
import { writeSignal } from 'solid-js'
// @ts-expect-error sharedConfig is not part of the Solid 2 public API.
import { sharedConfig } from 'solid-js'
// @ts-expect-error $DEVCOMP is not part of the Solid 2 public API.
import { $DEVCOMP } from 'solid-js'
// @ts-expect-error The Solid 1 web subpath was removed.
import * as oldWeb from 'solid-js/web'
// @ts-expect-error The Solid 1 store subpath was removed.
import * as oldStore from 'solid-js/store'
// @ts-expect-error The Solid 1 h subpath was removed.
import * as oldH from 'solid-js/h'
// @ts-expect-error The Solid 1 html subpath was removed.
import * as oldHtml from 'solid-js/html'
// @ts-expect-error The Solid 1 universal subpath was removed.
import * as oldUniversal from 'solid-js/universal'
// @ts-expect-error The context itself is the provider; Provider was removed.
createContext(0).Provider
// 08-dev-diagnostics.md: a store setter is a synchronous transaction, never an async callback.
// @ts-expect-error Store setter callbacks may return the host record or void, not a Promise.
setStore(async draft => { draft.count = 2 })

// RFC 08 record augmentation preserves known names and typed fields.
import { OBSERVE } from 'solid-js'
// @ts-expect-error unknown record name is not a documented record type
OBSERVE!.records.subscribe('invented-conformance-record', () => {})
// @ts-expect-error timing is numeric, not a string
OBSERVE!.records.subscribe('call', e => { const timing: string = e.durationMs; void timing })
