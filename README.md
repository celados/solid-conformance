---
type: Reference
title: Solid 2 conformance — Wave 2
description: Bun、系统 Chrome、HEAD 优先的 CSR／流式 SSR／hydration 与文档契约测试。
---

# Solid 2 conformance

本项目只验证和记录差异，不修复框架，也不向上游写入。需要 Bun、系统 Google Chrome，以及上游 native compiler 构建要求的 Rust 工具链。

## 运行

```sh
bun install --frozen-lockfile
bun run upstream                    # 每轮刷新 next tarball，构建并链接 HEAD
bun test                            # 默认 HEAD、development；findings 不参与默认发现
bun run test:production              # 选择 production 导出和编译条件
bun run check
bun run regressions
CASES=100 SEED=20261007 bun run properties
TRANSITION_CASES=40 SEED=20261008 bun run transitions
bun run docs
STRICT_FINDINGS=1 bun run docs        # 文档差异也使宽测试失败
STRICT_FINDINGS=1 bun run transitions # 004 也使 property 失败，并进行 shrinking
```

默认测试识别已记录差异的具体失败签名，同时保存原始失败，独立 repro 保持红色。未知错误、不同失败签名、console／hydration 问题仍使测试失败。默认绿色不表示没有 finding。

## 版本和对照

默认 `TARGET=head` 会拒绝使用未链接的发布包；运行时回执记录真实链接路径、SHA 和构建模式。包的 version 字段仍可能显示 rc.13，判断 HEAD 应使用 `.upstream/active.json`。

```sh
UPSTREAM_REF=<SHA-or-ref> bun run upstream
bun run upstream --build-only
bun run upstream --link-built
bun run upstream --restore
TARGET=rc13 bun test ./findings/004-derived-store-rejection/repro.test.ts
TARGET=rc13 BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
bun run upstream --link-built         # 对照结束后恢复 HEAD
```

`solid-js`、`@solidjs/web`、signals、compiler、diagnostics 的发布基线通过 `bun add --exact` 固定为 rc.13。Router 没有 rc.13 版本，锁定其独立发布线 `2.0.0-next.35`。HEAD 脚本通过 Bun 调用 Rollup、TypeScript、NAPI，下载 tar 快照到 `.upstream/`，不修改上游 checkout。Router 仍使用上述发布版本；本轮没有构建 Router HEAD。

## 每项差异的单命令复现

```sh
bun test ./findings/004-derived-store-rejection/repro.test.ts
bun test ./findings/005-keyed-reconcile-identity/repro.test.ts
bun test ./findings/006-storepath-export/repro.test.ts
bun test ./findings/007-loading-on-accessor/repro.test.ts
BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
```

001–003 在 rc.13 失败，在本轮 HEAD 通过，状态为 fixed-upstream。005 是已有订阅剪枝设计的文档措辞差异，状态为 duplicate。预期、实际、版本、去重和缩减记录见 [LEDGER.md](LEDGER.md)。

## Harness 与轨道

同一个 TSX AST 通过 native compiler 分别构建 DOM 和 SSR bundle。CSR 和 hydration 都使用 Playwright `channel: 'chrome'`；不下载浏览器。流式 hydration 的完整 document 由 Solid SSR 生成，使用 HydrationScript、NoHydration 和带 `app` renderId 的 Hydration 区域，让框架安排 payload 与 module 启动顺序。DOM 比较仅移除 hydration 标记、注释及传输 script/template，保留内容与业务属性。

- `harness/timing.ts`：deferred promise、多订阅可控 iterable、reject/end/return、开关计数和 tick stepping。
- `tracks/regressions`：五个历史 issue 家族；生产模式的 optimistic 矩阵只跑 attribution off，因为 OBSERVE 不在生产包中。
- `tracks/properties`：小树生成、CSR／hydration 等价、settle 排列、内部或根节点 Loading／Show 包装不变、迭代器释放、收敛与 shrink。
- `tracks/transitions`：八个转换家族、四种 primitive、两种 async source；失败、supersession、pending remount、共享／独立路由源、失败 action 和点击交错。
- `tracks/docs`：按 RFC 文件与 statement 注册可执行断言；覆盖清单及缺口见 [COVERAGE.md](tracks/docs/COVERAGE.md)。

回执写入 `artifacts/`。properties 可用 `RECEIPT`、transitions 可用 `TRANSITION_RECEIPT`、docs 可用 `DOC_RECEIPT` 选择输出路径；fast-check 用 `SEED` 和 `REPLAY_PATH` 重放。交付证据保存在 [evidence/](evidence/)。

## 限制和下一轮

当前 reconnect 是换源／换 generation，未覆盖真实断线、重连、HTTP backpressure。SSR 只验证初始 async 数据的 hydration，然后在浏览器驱动状态转换；未验证带服务器拒绝的流式错误 takeover。转换生成器从八个事件模板抽样，并非任意操作序列，也未枚举所有事件／yield 交错。tick 是实际 event-loop turns，不是虚拟时钟；每个页面有 15 秒上限，文档单项有 2 秒上限。

文档轨道尚未达到逐句全覆盖：09 类型／JSX ownership、11 实验性 server components、08 的大部分 diagnostics／attribution，以及 10 的客户端 live transport 都需要继续补测。全文 statement 总数尚未审计，不能用已登记的 141 个 case ID 声称完成率 100%。Wave 3 优先完成这些缺口，再扩展网络生命周期及任意事件序列。

完整 Wave 2 回执见 [evidence/wave2-receipt.md](evidence/wave2-receipt.md)。
