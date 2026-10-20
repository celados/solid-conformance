---
type: Review
title: Glaze 和 Delta 历史踩坑的 conformance 与依赖 patch 闭环
description: >
  从两个产品的提交历史追溯真实故障，固定 RC15 与当前 HEAD 重现，补原始红例，
  并以依赖边界 patch 替换可验证的应用绕行。
generated: { by: codex/gpt-6.1-sol, at: 2026-10-20 }
solid_head: 2172a37687e92dd91758476423f08cb4a12bcb0c
plugin_head: ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0
status: filed-upstream-local-patches-under-review
---

# 处置原则

本轮上游回执：[新 issue #4165](https://github.com/solidjs/solid/issues/4165)、
[CSS 补充](https://github.com/solidjs/solid-vite-plugin/issues/456#issuecomment-6282379465)、
[prebundle 补充](https://github.com/solidjs/solid-vite-plugin/issues/428#issuecomment-6282379136)、
[compiled Loading 补充](https://github.com/solidjs/solid/issues/3851#issuecomment-6282379876)。
Conformance 变更为 [PR #1](https://github.com/celados/solid-conformance/pull/1)。

本轮用户明确授权补 conformance case 并向上游提交；这次会话授权覆盖仓库默认的只读/不提交上游约束。
保留其他会话的工作目录、已有 `.orchestration` 文件与根 checkout 的包链接。
所有修改在独立 worktree 中完成；上游源为无 Git root 的 tar 快照，编译产物仅执行、不作为解释源码。

原始 case 始终断言期望行为。未修时应红，上游修复后自然转绿；不把“应该抛错/应该缺内容”作为永久通过条件。
已有 issue 只补证据。实际语义适配、产品策略和本地缺陷不冒充 Solid bug。

# 新 case 与当前结果

| Case | 真实故障 | RC15 | 当前 HEAD | 处置 |
| --- | --- | --- | --- | --- |
| [058](../findings/058-list-cleanup-write/README.md) | For 删除行时 cleanup 写共享状态，dev 整体停止响应 | dev 红 | dev 红；production 对照绿 | 新 issue；验证 cleanup imperative boundary patch |
| [059](../findings/059-server-component-css/README.md) | use server 下的 CSS 不进入生产 client graph | SSR/frame 红 | 同样红 | duplicate [plugin #456](https://github.com/solidjs/solid-vite-plugin/issues/456)，补可执行矩阵 |
| [060](../findings/060-server-functions-prebundle/README.md) | dev prebundle 生成双 transport 配置，合法 frame 得到 undefined | 红 | 红，plugin 也从固定 HEAD 构建 | duplicate [#428](https://github.com/solidjs/solid-vite-plugin/issues/428)，保留已有 [#430](https://github.com/solidjs/solid-vite-plugin/pull/430) 修复方向 |

059 的 client-import 正控、060 的 child-subpath-include 正控，在两版本均通过；它们只用于隔离根因，
本地应用仍以依赖 patch 为交付方向。059/060 均使用 case 自己的依赖图，不切换 root links。

058 source patch 将两类实际 cleanup 回调通过 `runWithOwner(null, callback)` 执行，恢复调用前 context/tracking，
没有放宽 setSignal 的 guard，也没有用 disposalDepth 全局豁免。7 项 browser 断言通过，包含普通 compute
以及 cleanup 内嵌 compute 的非法写入仍被拒绝。相同 Node/Vitest 4.1.6 runner 下，signals 的原始与 patched
源码均为 323 文件、5387 passes、3 expected failures、2 skips。详见 [receipt](evidence/field-cleanup.json)。

# 已有 case 的重新核验

| Case | 新结果 | 对升级的含义 |
| --- | --- | --- |
| [055 delayed navigation feedback](../findings/055-held-navigation-feedback/README.md) | RC15 红；当前 HEAD 绿 | [#4050](https://github.com/solidjs/solid/issues/4050) 的修复尚未进入 RC15；不能因当前 next 正常就说 RC15 正常。升级时需要明确选择 backport 或保持门禁阻断。 |
| [056 latest-mounted Loading](../findings/056-latest-mounted-boundary/README.md) | RC15、当前 HEAD 都红 | 已关闭 [#3851](https://github.com/solidjs/solid/issues/3851) 的新 compiled JSX 形状仍失败，补充现有 issue，不另开重复报告。 |

当前证据在 [RC15](evidence/field-existing-held-rc15.log)、[055 HEAD](evidence/field-055-head.log)、
[056 HEAD](evidence/field-056-head.log)。055 的新结果不改写旧 Wave 5 历史矩阵。

# 提交历史吸收表

| 来源 | 历史事实 | 本次判断 |
| --- | --- | --- |
| [Glaze eb3745a7 / PR237](https://github.com/celados/glaze/commit/eb3745a7) | 删除行菜单会触发 teardown write；merge 与原提交是同一 patch | 提炼为 058；可以用 runtime patch 删除 teardownDepth/live write microtask，保留 stopped machine 和 pending cancel 业务规则。 |
| [Glaze 269550d8](https://github.com/celados/glaze/commit/269550d8) | RC9 A28 让 read/latest 看不到未 flush 写入 | Zag written mirror 是同步协议适配，不能 patch 回旧 Solid 语义。 |
| [Glaze e8ca3715](https://github.com/celados/glaze/commit/e8ca3715) | children 求值混入 machine 依赖，DOM/焦点被重建 | 问题早于 RC10；保留 Slot owner/children 稳定结构。 |
| [Glaze 67393309 / de1c6f4f](https://github.com/celados/glaze/commit/67393309) | render 丢 ref、orphan effect 清 ref | 已有 adapter 修复，非新 Solid runtime finding。 |
| [Glaze dcd43a8c](https://github.com/celados/glaze/commit/dcd43a8c) | Key record stale 与 Zag toast heights 反序是两个问题 | 后续分别向 primitives/Zag 归因；原生 For 本身是正规实现，不以改回 Key 为目标。尚未形成新红例，不新增 finding。 |
| [Delta 0a9a82da](https://github.com/celados/delta/commit/0a9a82da) | 独立 RC15 spike 已做 event adapter，并加入 11 probe | 吸收请求边界方案；held UI 对应 055/056。不能沿用该 commit 没有 receipt 的“结果”，其中一个最终文本断言还存在多元素匹配问题。 |
| [Delta 116ad5c6](https://github.com/celados/delta/commit/116ad5c6) | 为 held Show stale read 使用 keyed | #4010 在 RC15 已修，属于移除候选；named error boundary 继续有产品容错职责。 |
| [Delta 708bc5cb](https://github.com/celados/delta/commit/708bc5cb) | live memo hybrid/list client 避免 #3764 | RC15 原问题已修；恢复 SSR 必须保留真实接管/订阅时延测试。分页携带函数不可序列化是另一个边界。 |
| [Delta d7917be2](https://github.com/celados/delta/commit/d7917be2) | 稳定 Promise reader 避免 SSR retry churn | #3734 iterable 部分已修，但 reader 仍拥有 auth/request isolation/dedup；不整层删除。 |
| [Delta d9540421 / 90b2aff6](https://github.com/celados/delta/commit/d9540421) | prebundle/CSS 已改为 dependency patch | 加 059/060 作为长久 removal gate，移植而非丢弃未修的 patch。 |
| [Delta b1e052da](https://github.com/celados/delta/commit/b1e052da) | 无法由 client router 解析的 URL 交回 server document | 服务端资源/部署恢复策略，不直接报 Solid。 |
| [Delta 2c49a57b / ff233263 / 1001422a](https://github.com/celados/delta/commit/1001422a) | retention、signout lease、client owner 收敛 | 产品性能和本地所有权修复，保留。 |

# 本地 patch 的交付边界

候选产品变更：[Glaze PR #273](https://github.com/celados/glaze/pull/273)、
[Delta PR #945](https://github.com/celados/delta/pull/945)，均为 draft。

Glaze 与 Delta 都锁在 RC10，本轮不顺带升级 RC15。RC10 cleanup patch 由 Glaze 持有源差异和包管理器
patch；Delta 在安装前需要同一补丁字节，不能依赖 Glaze 的 patchedDependencies 传递。
两仓补丁 SHA256 均为 `169a9617d0c7b51f494e7a07e993907018a1de6a506f48ce15d9c5c8632fb693`。

Glaze 移除 teardownDepth 与 live-machine commit microtask；停止后不回调、Zag 写入镜像、Slot、refs、
注册期 ownedWrite 等语义继续存在。独立 packed consumer 显式配置自己的 root override/patch policy。
Delta 的 package qualification test 在真实消费图中先红后绿，防止“库仓有 patch、应用没装 patch”。

移除条件是：选择新的精确上游版本后，不带本地 patch 的 058 及实际消费图均转绿，
再删除包管理器 patch、消费方安装声明和对应临时说明。059/060 同理，不按 issue closed 单独判断。

# 升级结论

建议继续固定 RC15 的协调升级资格验证，收益主要来自已修复的 held Show、live source SSR 接管、
rootHoles 以及新 plugin 的原生请求 nonce；这些收益不意味着可以删除全部适配。历史追溯新增了两个
必须纳入门禁的风险：055 的修复未进入 RC15，056 在当前 HEAD 也未修。RC15 方案应明确是否回移植
055 的上游修复，并保留 CSS/prebundle/cleanup 等未修问题的依赖 patch 与原始红例。

本轮只把一个已验证的隐藏绕行移到依赖边界。注册期 ownedWrite、同步 written mirror、Slot/refs
所有权和请求隔离仍有独立职责；不能把“恢复正规写法”理解为移除这些结构。

# 产品侧验证

- Glaze RC10 patch + 删除微任务绕行：headless 57 tests、Chrome 菜单删行 4 tests、生产 headless
  13 tests、生产 SSR hydration 3 tests、Solid typecheck 与 root lint 通过。
- 独立 packed Solid/vanilla 与 headless consumers 通过；Start consumer 的 prerender、streaming、
  hydration 通过。完整 packed React consumer 为 157 pass / 2 fail；定向复跑 sidebar 通过，
  TooltipRootProvider 仍为 closed 而预期 open。React 图中无 Solid 模块，但未跑原始 baseline，
  不归因为既有故障，也不声称完整 consumer gate 绿色。
- Delta installed graph 058 派生测试先红后绿。补齐本地 codegen 后，`check:changed` 全部通过，
  包含 31/31 TypeScript 工程与受影响测试；Solid 为 19 files / 124 tests。dead-code 检查的六项
  devDependency finding 均已被原配置抑制。首次 pre-codegen 检查另有一次 Engage timer 断言失败，
  其单独重跑与最终完整 Solid tests 均通过，未作 baseline 归因。
- Delta 当前仍消费 Glaze 0.24.2；这不是候选 Glaze 包与 Delta 的完整组合验收。产品 PR 保持 draft，
  后续仍需协调包版本及消费端 gate。
- Delta bindings 的真实生产浏览器 hydration 通过，包括现有 RC10 的负控。Whiteboard 本地生产
  smoke 构建与水合成功，但 6 项登录态路由中 5 项失败：4 项缺少 aside/workspace，editor 的
  本地素材请求被 CSP connect-src 阻止；仅 studio/new 通过。Glaze 0.24.2 的 sidebar 源码使用 div，
  和 smoke 的 aside 合同不符；未跑无 patch 基线，
  因此记录为未通过的产品门禁，不将其直接归因于 patch，也不修改 smoke 以消除失败。

# 验证限制

- 新增 case 与其 fixtures 的 targeted types 通过；根 `bun run check` 对当前 HEAD 仍有历史 tracks
  引用已移除 API、旧类型合同的错误。未修改那些历史轨道，也不声称整个 conformance 绿色。
- 059 未新测 dev/CSSModule；060 未穷尽 plain/rich-args 传输。
- 058 是 development guard 故障，不夸大为 production crash；source patch 也不等于上游已接受修复。
- 没有升级、发布包、合并产品 PR 或部署。
