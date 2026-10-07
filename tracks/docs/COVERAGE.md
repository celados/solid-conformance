---
type: Reference
title: Wave 2 RFC coverage inventory
status: partial
upstream_commit: 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712
description: 已执行 statement、文档差异和未完成审计的覆盖缺口。
---

# 文档覆盖

来源：[Solid next documentation/solid-2.0](https://github.com/solidjs/solid/tree/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0)。每个注册项保留文件名与行为句子，runner 将逐项结果写入 JSON。当前 141 个唯一 case ID，按文件与句子去重后 137 个行为声明，163 个适用的 client/server 执行结果。

**covered / total：137 / 未完成全文逐句盘点。** 这里不是 137/137 的全覆盖证明；已登记的断言均有可执行测试，但这轮没有完成原工作单要求的所有 behavioral statements。下表是已覆盖部分的准确索引。

## 章节与缺口

| 章节 | 已登记 ID | 待补测试 |
| --- | ---: | --- |
| 01 | 11 | 其他 options、equality、reaction 与取消组合 |
| 02 | 8 | 更广的 derived source/owner 组合 |
| 03 | 24 | 嵌套 Reveal、复合 reset、动态组件切换 |
| 04 | 14 | 多层 keyed reconcile、更多浅边界与 path 模式 |
| 05 | 14 | server-source adoption / client takeover 全矩阵、fetch replay |
| 06 | 11 | 多个 action 并发、嵌套 until 与 authority 组合 |
| 07 | 7 | style/spread、自定义事件与完整 element-claim 生命周期 |
| 08 | 2 | 大部分 diagnostics、OBSERVE.records、attribution 与性能轨道 |
| 09 | 0 | 类型／JSX ownership：未实现 dedicated compile fixtures |
| 10 | 19 | 客户端 RPC roundtrip、live/reconnect、rich args、single-flight |
| 11 | 0 | 实验性 server components：未实现 transport/slot/adoption 轨道 |
| 12 | 31 | 背压、断连及流式错误 takeover 更广组合 |

README、MIGRATION 和 _template 的导航／写作约定未计为新的运行时契约；其中迁移行为应映射回对应 RFC，不应以这种去重方式遗漏行为。

## 不可直接转成确定性行为断言的内容

历史性能数字（KB、benchmark 提速）缺少固定构建输入和测量平台；future/open question 与尚未发布的 stabilization 计划不是当前行为；Chrome DevTools 面板的视觉排列依赖浏览器 UI 版本。它们需分别做固定条件 benchmark、后续实现追踪和人工／UI 验证，不计为已覆盖。上表待补项都是可测试的缺口，不能归为不可测试。

## 已执行 statement

断言定义在 core-cases.ts、render-cases.tsx、http-cases.tsx、rpc-cases.ts；docs.test.ts 在真实 Chrome 和独立 SSR artifact 上统一执行。已知失败的原始 error 保留在 receipt，默认只接受具体签名；STRICT_FINDINGS=1 禁用该识别。

| ID | RFC 文件 | 行为句子 | 执行平台 |
| --- | --- | --- | --- |
| 01/eager-memo | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | Without lazy, memos compute eagerly on creation. | client |
| 01/effect-defer | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | Run on next change only (skip initial). | client |
| 01/effect-prev-cleanup | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | The compute function receives prev as its argument (undefined on first run). | client |
| 01/effects-order | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | Running all tracking halves of effects before any effect halves gives a clear dependency picture before side effects run. | client |
| 01/flush-callback | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | The callback's return value is preserved, and nested flush(fn) calls drain at each level. | client |
| 01/flush-reads | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | After calling a setter, reads continue to return the last committed value until the batch is flushed. | client |
| 01/lazy-memo | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | The lazy option defers the initial computation until the value is first read. | client |
| 01/microtask | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | Updates are applied on the next microtask by default. | client |
| 01/render-effect | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | createRenderEffect runs during the render phase synchronously as DOM elements are created. | client |
| 01/settled-cleanup | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | onSettled replaces onMount: run logic when the current activity is settled. | client |
| 01/unobserved | [01-reactivity-batching-effects.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md) | An unobserved callback fires when the signal/memo loses all subscribers. | client |
| 02/cleanup-lifo | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | Within one owner later registrations run before earlier ones. | client |
| 02/context-default | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | useContext falls back to defaultValue outside any Provider. | client |
| 02/context-missing | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | useContext throws ContextNotFoundError at runtime if no Provider is mounted. | client |
| 02/context-provider | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | The context itself is a component that takes a value prop and provides it to descendants. | server, client |
| 02/derived-store | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | createStore(fn, seed) creates a derived store driven by mutation in fn(draft). | client |
| 02/detached-root | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | Detach explicitly with runWithOwner(null, ...). | client |
| 02/owned-roots | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | A root created inside an existing owned scope is itself owned by that parent. | client |
| 02/writable-derived | [02-signals-derived-ownership.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md) | A write on its own never re-runs the function. | client |
| 03/client-only-once | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | The clientOnly importer is invoked at most once no matter how many instances render. | client |
| 03/client-only-ssr | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | clientOnly renders props.fallback on the server and never starts the import. | server |
| 03/dynamic-tag | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | dynamic returns a stable component driven by a reactive source. | server, client |
| 03/error-fallback | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Errored supports a callback receiving an error accessor and reset. | server, client |
| 03/error-once-reset | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Once per error object: reset that recomputes the same failing node says nothing new. | client |
| 03/fallback-errors-parent | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Errors in the fallback reach the parent boundary. | client |
| 03/for-custom | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Custom-keyed For receives two accessors. | server, client |
| 03/for-empty | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Empty For inputs render the fallback. | server, client |
| 03/for-identity | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Default keyed For receives a raw item and an index accessor. | server, client |
| 03/for-key-preservation | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Custom keys preserve rows while either argument changes. | client |
| 03/for-positional | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | For keyed false receives an item accessor and a plain index. | server, client |
| 03/for-slot-preservation | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | For keyed false reuses by index. | client |
| 03/match-accessor | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Non-keyed Match function children receive an accessor. | server, client |
| 03/match-keyed | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Keyed Match function children receive the raw narrowed value. | server, client |
| 03/repeat-empty | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Repeat renders fallback when count is zero. | server, client |
| 03/repeat-offset | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Repeat renders based on count and optional from; children receive a plain number. | server, client |
| 03/reveal-natural | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Reveal order natural coordinates sibling Loading boundaries. | client |
| 03/reveal-sequential | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Reveal order sequential coordinates sibling Loading boundaries. | client |
| 03/reveal-together | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Reveal order together coordinates sibling Loading boundaries. | client |
| 03/show-accessor | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Non-keyed Show function children receive a narrowed accessor. | server, client |
| 03/show-fallback | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Show supports element children and a fallback. | server, client |
| 03/show-keyed | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Keyed Show function children receive the raw narrowed value. | server, client |
| 03/switch-fallback | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Switch supports a fallback. | server, client |
| 03/switch-first | [03-control-flow.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md) | Switch picks the first matching Match. | server, client |
| 04/array-return | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Returning a value performs a shallow replacement/diff. | client |
| 04/deep-snapshot | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | deep subscribes to every nested property and returns a plain snapshot. | client |
| 04/draft-first | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | The primary store update form is a setter that receives a mutable draft. | client |
| 04/keyed-reconcile | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | reconcile preserves identity for unchanged entries. | client |
| 04/merge-undefined | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | undefined is a value, not missing. | client |
| 04/object-return | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Returning a value performs a shallow replacement/diff. | client |
| 04/omit-view | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Use omit to create a view without the listed keys. | client |
| 04/positional-reconcile | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Pass null for positional matching. | client |
| 04/projection-late-write | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | The draft stays valid until the next run or disposal. | client |
| 04/readonly-projection | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | createProjection returns only the store. | client |
| 04/shallow-references | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Values under root keys are plain records replaced by reference. | client |
| 04/snapshot-untracked | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | snapshot produces a non-reactive plain value suitable for serialization. | client |
| 04/stale-draft | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | Writes through a superseded or disposed draft are dropped silently. | client |
| 04/store-path | [04-stores.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/04-stores.md) | storePath supports indices, filters, ranges and a delete sentinel. | client |
| 05/client-source-ssr | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | With ssrSource client the server compute never runs. | server |
| 05/declared-client-ssr | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | With loadingValue the server renders the declared first paint. | server |
| 05/defer-stream | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | deferStream true defers the SSR stream flush until the first value resolves. | server |
| 05/effect-error | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | createEffect accepts an EffectBundle with effect and error handlers. | client |
| 05/iterable-values | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Computations can return AsyncIterables. | client |
| 05/loading-on-constant | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | The value returned by on is never compared; only the notification matters. | client |
| 05/loading-revalidation | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Once Loading has rendered content it keeps stale content during revalidation. | client |
| 05/loading-value | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | The node is born committed with the declared value. | client |
| 05/promise-resolution | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Consumers read the accessor as usual if it is not ready the read follows Loading. | client |
| 05/refresh-delivery | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Accessor targets resolve with the settled value. | client |
| 05/refresh-quiescence | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | If a second refresh supersedes this one mid-flight the promise waits for whatever finally lands. | client |
| 05/refresh-quiet | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | A bare refresh is quiet: isPending stays false. | client |
| 05/resolve-rejection | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Async errors propagate through the reactive graph. | client |
| 05/seed-loading-value | [05-async-data.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md) | Store-family sources declare seedLoadingValue true. | client |
| 06/action-rejection | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Failure throws back at the yield point. | client |
| 06/action-return | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | action wraps a generator and returns an async function. | client |
| 06/affects-readability | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Marked data reads pending while values themselves stay readable throughout. | client |
| 06/overlay-signal-failure | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Optimistic primitives reset to their source when the transition completes. | client |
| 06/overlay-signal-success | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Optimistic primitives reset to their source when the transition completes. | client |
| 06/overlay-store-failure | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Optimistic primitives reset to their source when the transition completes. | client |
| 06/overlay-store-success | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Optimistic primitives reset to their source when the transition completes. | client |
| 06/until-abort | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | until rejects on signal abort with the signal reason. | client |
| 06/until-authority | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Your own tentative write can never satisfy your own ack. | client |
| 06/until-timeout | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | until rejects on timeout with TimeoutError. | client |
| 06/until-truthy | [06-actions-optimistic.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md) | Falsy results keep waiting; until resolves the first truthy settle. | client |
| 07/boolean-attribute | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Boolean literals add/remove the attribute; strings preserve true. | server, client |
| 07/class-compose | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | class accepts string, object or array of strings and objects. | server, client |
| 07/events-once | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Event handlers bind once; the binding expression is not reactive. | client |
| 07/portal-events | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Portal registers outside-root mount points as additional listener containers. | client |
| 07/ref-array | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Ref arrays are flattened and called with the element. | client |
| 07/root-events-dispose | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Delegated listeners are disposed when the render root is disposed. | client |
| 07/shadow-root | [07-dom.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/07-dom.md) | Rendering into a ShadowRoot attaches delegated listeners to that shadow root. | client |
| 08/owned-write | [08-dev-diagnostics.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md) | Writing inside owned scope throws in dev. | client |
| 08/owned-write-opt-in | [08-dev-diagnostics.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md) | ownedWrite is the narrow opt-in for internal state. | client |
| 10/cache-opt-in | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Cache headers flow through the handler response metadata. | server |
| 10/default-post | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Undeclared references call over POST; GET requires declaration. | server |
| 10/direct-call | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | In-process SSR calls execute the original function directly with no HTTP loopback. | server |
| 10/get-metadata | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | GET composes with withMeta in either order. | server |
| 10/get-read | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | GET declared references permit GET and HEAD without a body on HEAD. | server |
| 10/http-dispatch | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | The handler resolves id, decodes positional arguments and encodes the result. | server |
| 10/invocation-context | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | getServerFunctionInvocation answers the current in-flight id. | server |
| 10/invoke-contract | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Non-invocable wrappers produce a directed error. | server |
| 10/invoke-direct | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Server invoke runs in-process; transport hints are no-ops. | server |
| 10/metadata-merge | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | withMeta returns the reference and shallow-merges later writes over earlier ones. | server |
| 10/method-405 | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Other methods receive 405. | server |
| 10/no-store-default | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Every response has Cache-Control no-store unless the function declares a policy. | server |
| 10/per-call-event | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Direct calls get a shallow copy of locals while nested values remain shared. | server |
| 10/redirect-control | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Thrown Response/envelope control flow is forwarded untouched. | server |
| 10/reference-brand | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | isServerFunction reads the symbol-branded reference contract. | server |
| 10/reference-id | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Both proxies carry id and url. | server |
| 10/reference-nonfunction | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | registerServerReference throws when handed a non-function. | server |
| 10/thrown-sanitization | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | Outside development plain thrown errors are replaced with a generic Error. | server |
| 10/unknown-reference | [10-server-functions.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/10-server-functions.md) | An unregistered well-formed address receives a labelled 404. | server |
| 12/aborted-before-shell | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | A render aborted before flush resolves to bodyless 500 and never rejects. | server |
| 12/client-http-noop | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | httpStatus and httpHeader are no-ops on the client. | client |
| 12/commit-cookies | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Stub cookies append beside response cookies entry-by-entry. | server |
| 12/commit-idempotent | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | An already-committed stub passes the response through untouched. | server |
| 12/commit-other-precedence | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Response metadata wins; ordinary stub headers fill only gaps. | server |
| 12/commit-other-status | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | commitEventResponse never takes status from the stub. | server |
| 12/cookie-default-path | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | path defaults to /, the only default. | server, client |
| 12/cookie-delete | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Deleting is expiring: empty value plus Max-Age=0. | server, client |
| 12/cookie-options | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | domain/maxAge/expires/httpOnly/secure/sameSite are emitted exactly when given. | server, client |
| 12/cookie-response-not-request | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | A Set-Cookie appended in the same request does not read back. | server |
| 12/cookie-roundtrip | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Names and values travel percent-encoded and the parser decodes symmetrically. | server, client |
| 12/early-redirect | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Location before shell flush produces a real bodyless redirect with cookies. | server |
| 12/event-init | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | init spreads over defaults so a framework can extend the shape. | server |
| 12/fresh-events | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | createRequestEvent builds request, locals and a fresh uncommitted response stub. | server |
| 12/head-committed-noop | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Both declaration writes and retractions no-op once the head is committed. | server |
| 12/head-retraction | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Each declaration snapshots the prior value and restores it when its owning scope is disposed. | server |
| 12/hydration-script | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | generateHydrationScript returns the bootstrap string with nonce. | server |
| 12/middleware-order | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | next advances the chain, and outermost middleware unwinds before the wire. | server |
| 12/middleware-request | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | next may substitute the Request downstream. | server |
| 12/one-consumer | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Exactly one consumption surface may be used per render. | server |
| 12/request-scope | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | getRequestEvent reads the current event anywhere under a request scope. | server |
| 12/ssr-response-cookies | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Every materialized response carries Set-Cookie entry-by-entry. | server |
| 12/ssr-response-string | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | String results return a Response synchronously and commit the stub. | server |
| 12/stream-readable | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | readable yields Uint8Array bytes suitable for a Response body. | server |
| 12/stream-response-head | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Stream results resolve at shell flush, with stub committed. | server |
| 12/stream-thenable | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Awaiting renderToStream resolves with fully resolved HTML. | server |
| 12/sync-fallback | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | renderToString is synchronous; async boundaries render their fallbacks. | server |
| 12/trace-continuation | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | getTraceContext continues a valid incoming traceparent and returns one object per request. | server |
| 12/trace-invalid | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Malformed all-zero ids are ignored and a new trace originates. | server |
| 12/trace-sampled-wire | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | Sampled trace entries are emitted as Server-Timing on commit. | server |
| 12/trace-unsampled-wire | [12-ssr-http.md](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md) | An unsampled upstream trace stays off the browser wire. | server |
