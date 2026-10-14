---
type: Issue
status: draft
filing: fileable
repo: solidjs/solid
target: solidjs/solid
head: e3716454129f8438b65257c95db5c383622494ba
title: '[2.0 rc.15 + next] Solid 2 documentation errata: untrack writes, pinned derivations, effect error callback, storePath, derived-store migration example'
findings: ['015', '013', '030', '006', '047']
supersedes: ['16', '17', '18', '19', '26']
repro_commit: 44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759
---

### Describe the bug

Five copied Solid 2 documentation examples disagree with the runtime or public declarations.

#### Untrack writes
```ts
createRoot(() => { const [, setN] = createSignal(0); untrack(() => setN(1)); });
```
Throws REACTIVE_WRITE_IN_OWNED_SCOPE. Move writes to handlers/onSettled, or explicitly opt into ownedWrite; untrack does not clear ownership. [Doc](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/01-reactivity-batching-effects.md#L20).

#### Pinned derivations
`createSignal(prev => prev?.pinned ? prev : { n: source(), pinned: false })`
Pin at 99, then unpin and change source to 3 together: n stays 99. Read source unconditionally before choosing the pinned result to retain the dependency. [Doc](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/02-signals-derived-ownership.md#L132).

#### Effect error callback
`createEffect(() => 1, () => {}, () => {})`
Fails TS2559: the third argument is EffectOptions. Use the second-argument { effect, error } bundle. [Doc](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/03-control-flow.md#L169).

#### storePath
`import { storePath } from "solid-js"`
Fails TS2305: no public export. Export the promised helper/types, or replace this recipe with a supported draft setter. [Doc](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/04-stores.md#L45).

#### Derived-store migration example
`const [items] = createStore(() => [1, 2], []); createStore(draft => { draft.total = items().length; }, { total: 0 });`
Fails TS2349: items is a proxy, not callable. Use items.length. [Doc](https://github.com/solidjs/solid/blob/e3716454129f8438b65257c95db5c383622494ba/documentation/solid-2.0/MIGRATION.md#L466).

### Your Example Website or App
[Standalone five checks, corrected controls and README](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/30-documentation-errata).

### Steps to Reproduce the Bug or Issue
```sh
cd report/repros/30-documentation-errata
bun install
bun run repro
```
The README also provides a one-command clean setup and a next-tag switch.

### Expected behavior
The documented recipes work or typecheck. All five checks fail on rc.15; corrected controls pass.

### Platform
Solid rc.15 / next e3716454129f; Bun 1.4.2; client development runtime and public TypeScript declarations.

### Additional context
The snippets above show each mismatch; the standalone files include imports, owned roots, update order and cleanup.
