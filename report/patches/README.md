---
type: Reference
title: RC15 held-navigation and compiled Loading source patches
description: >
  Qualified upstream backport for 055 and a small local source proposal for 056,
  with original red cases, regression suites and explicit installation boundaries.
generated: { by: codex/gpt-6.1-sol, at: 2026-10-20 }
status: source-candidates-qualified-not-installed-in-products
solid_rc15: 4937f0a2bfddd45a65738c189075aff577530073
solid_head: 2172a37687e92dd91758476423f08cb4a12bcb0c
---

# 055：回移植上游已合并修复

[4050-rc15.source.patch](4050-rc15.source.patch) 直接取自上游
[PR #4065](https://github.com/solidjs/solid/pull/4065)，合并 commit
`0109a56991976d2d44696a415e2c58cbefe898ca`。保留三个 signals 源码文件与原始 signals
回归测试；没有复制 changeset、文档或 web 测试。源码 hunks 无需修改即可应用到 RC15。

它把 verdict memo 的 display-ahead 属性传给读取它的普通 memo，避免 Provider 将 pending feedback
与 held outlet 合成一个 memo 后，反馈也被 hold。不是修改 Provider 或给应用添加 DOM 包裹。

stock RC15 的原始 055 红；只回移植该修复后，055 在 development/production 转绿，056 仍红。
只含此 backport 的 RC15 signals suite：301 files，5214 passed，20 expected fail，2 skipped。

# 056：已知语义问题的新复现形状与本地修复候选

上游 [#3851](https://github.com/solidjs/solid/issues/3851) 是已知同类问题，已由 #3869 关闭；
不能把它称为“上游仍开着、已确认未修”。截至本轮读取，maintainer 尚未回应我们新增的 compiled
JSX 复现。原始 primitive 测试已经通过，但嵌套 DOM render effect 的形状仍失败，RC15 与固定 HEAD
均由真实 Chrome 观察到 `outer 0 + inner 1`，而期望是 `outer 0 + pending`。
本轮已将新的 signals 红例、候选修复和完整矩阵[补充到原 issue](https://github.com/solidjs/solid/issues/3851#issuecomment-6282792628)，等待上游审查。
随后按用户要求新开 [#4166](https://github.com/solidjs/solid/issues/4166)，单独追踪原修复遗漏的
DOM render-effect 路径，避免后续审查依赖已关闭 issue 的可见性；#3851 保留为相关历史。

新缩小后的 signals pin 不需要浏览器、compiler、Router 或 async data：Show 的两级条件 memo，
加上 Loading 内容里的一项 `createRenderEffect`，即可复现同样的 tear。旧 pin 只在 boundary 的
返回值中读取信号，没有这项 DOM child effect。

- [3851-dom-mount-head.source.patch](3851-dom-mount-head.source.patch)：针对固定 HEAD。
- [3851-dom-mount-rc15.source.patch](3851-dom-mount-rc15.source.patch)：在 RC15 先应用 #4065 后使用。

两份均只改 `packages/signals/src/core/core.ts` 并加入一个原始红例。verdict lane 的新 mount 保持
mainline，但原逻辑只用直接调用者的 `prevLane` 判断 first pass 是否应 born-held；中间 content memo
把 lane 清为 mainline 后，DOM 子 effect 丢失 mount 来源信息，提前发布 staged value。

候选修复用栈式布尔上下文传递该 provenance，在现有 finally 恢复，不增加 node 字段、不改变 lane
seat，也不删除写入 guard。它只补 first-pass staged-read 的判定。HEAD 还保留新版 boundary fresh hook
的语义；RC15 没有该新 hook 参数，因此使用单独的版本差异，不能盲目套 HEAD diff。

# 验证结果

所有 signals suites 使用 Node 与同一 Vitest 4.1.6；所有 browser 使用 system Google Chrome。
根 runtime receipt 记录的是所选 base graph，另见 [patch qualification receipt](../evidence/loading-patches/qualification.json)
中实际被替换的 signals source/build 路径、patch 列表及日志。不能把 patched 结果当成 pristine HEAD。

| 图 | 原始 055 | 原始 056 | signals suite |
| --- | --- | --- | --- |
| stock RC15 | 红 | 红 | 本轮没有重跑 pristine 全套 |
| RC15 + #4065 | dev/prod 绿 | dev 红 | 5214 passed / 20 expected fail / 2 skipped |
| RC15 + #4065 + local 056 | dev/prod 绿 | dev/prod 绿 | 5215 passed / 20 expected fail / 2 skipped |
| pristine HEAD 2172a376 | dev 绿 | dev 红 | 前轮 baseline 5387 passed / 3 expected fail / 2 skipped |
| HEAD + local 056 | dev 绿 | dev/prod 绿 | 5388 passed / 3 expected fail / 2 skipped |

HEAD 与 RC15 combined 各跑 80 组 `STRICT_FINDINGS=1` 的 held-mount 属性测试，包含 static/function/keyed
children、嵌套 Errored 与不同 staged value；无 known-finding 豁免。该属性检查只覆盖 CSR development。
源码 build 类型检查通过。未在本轮新增 SSR/streaming/hydration 的 056 专项测试或产品全链路验收。

# 重现和删除条件

在隔离的 **source snapshot** 根执行，RC15 的应用顺序为：

```sh
patch -p1 < 4050-rc15.source.patch
patch -p1 < 3851-dom-mount-rc15.source.patch
cd packages/signals
node node_modules/vitest/vitest.mjs run
bun x --no-install rollup -c
bun scripts/mangle-props.mjs dist/prod
bun scripts/mangle-props.mjs dist/observe
```

HEAD 只应用它对应的 3851 source patch。上述 patches 应在 snapshot 根定位或使用绝对路径。
用 conformance 的 `scripts/build.ts` 将 `@solidjs/signals` 指向该 source-built 包，其他 core/web/compiler
保持所选版本一致，再执行原始 findings/055、056 及严格属性测试。

这里保存的是可复现的**源码 patch**，不是直接给 `bun patchedDependencies` 使用的发布包 patch。
产品仍锁 RC10，现有产品 PR 没有偷偷升级或安装这两项修复。正式切换 RC15 时，应基于精确发布包
制作安装期 patch，并重新跑真实消费图、产品 browser/SSR 门禁；候选修复仍需上游审查。

保留原始 desired-behavior case，默认不应用补丁。未来精确上游版本不带 patch 通过原始 case、严格
属性测试及产品门禁后，删除对应安装声明、patch 与临时说明。055 的上游 commit 已存在，可以采用
回移植；056 的源码候选不得因本地 suite 绿色就标记为 upstream-fixed。
