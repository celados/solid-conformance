---
type: Reference
title: Wave 3 verification receipt
status: complete
upstream_commit: 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712
description: 全文合同清单、运行模式、单命令最小差异及本地交付证据。
---

# Wave 3 回执

本轮开始重新解析 next、下载 tarball 并构建。Solid HEAD 为 `53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`，与 Wave 2 相同；没有把包内 rc.13 version 字符串当成 HEAD 身份。核心、signals、web、compiler、diagnostics 采用同一快照。Router 为 npm next 发布版 `2.0.0-next.35`，没有声称测试 Router Git HEAD。

Vite plugin 为独立 next 快照 `e4cdee454dbe0a99d9cb566d1dba72a93a9dcac1` / `3.0.0-next.47`，使用 Vite 8.3.3。工具链 Bun 1.4.2，浏览器均为系统 Google Chrome 155.0.8059.40，不下载 Chromium。

main 的 HEAD 构建已移入自己的 git-ignored .upstream/；Wave 1、Wave 2 worktrees 已移除。[housekeeping](wave3-housekeeping.json) 保留真实 symlink 目标。所有上游操作只读，没有创建 issue、评论或 PR。

## 文档清单

**covered / total：2082 / 2102**，另 20 条不可测试、0 条 uncovered；968 条导航、解释或作者指导不属于运行时行为合同。清单测试强制 uncovered 为 0。

全文 prose/table/code-comments 及纯代码合同先枚举再按稳定 source locator 覆盖。221 个完整代码块另行逐块审阅；代码块数不是行为分母。covered 表示有检查合同的可执行断言，包括最小红例，不表示框架行为全部通过。复合声明要求全部保证得到证明；无法公开测试的子保证保留明确原因。[逐条覆盖和不可测试原因](../tracks/docs/COVERAGE.md)。

## 最终逐文件验证

[最终矩阵](wave3-final-suite-matrix.json) 对当前全部 **93 文件**取最近一次有效证据，两模式各 **167 pass / 0 fail**。这是完整运行加后续增量补验的合成结果，不宣称最后又重复整套：开发初轮 79 文件、139/0；生产初轮 86 文件、153/1，其中唯一红文件是新增 docs 用例的已登记差异与当时未定位的 refresh 超时。原始红日志与初轮 JSON 均保留；最后 docs 两模式均通过，production 超时已由 action 完成、正确 store truth/通知、isPending=false 的前置断言精确确认 008。多构建 frame 文件自身循环三 tier，同一有效运行可同时证明两模式。

| 轨道 | 当前文件数 | development 测试单元 pass / fail | production 测试单元 pass / fail |
| --- | ---: | ---: | ---: |
| docs | 36 | 45 / 0 | 45 / 0 |
| frames | 36 | 97 / 0 | 97 / 0 |
| harness | 2 | 2 / 0 | 2 / 0 |
| properties | 1 | 1 / 0 | 1 / 0 |
| records | 6 | 6 / 0 | 6 / 0 |
| regressions | 1 | 5 / 0 | 5 / 0 |
| router | 8 | 8 / 0 | 8 / 0 |
| transitions | 2 | 2 / 0 | 2 / 0 |
| transport | 1 | 1 / 0 | 1 / 0 |

上述为 Bun test units，不能与源声明数量等同。宽 docs 注册表在每种模式运行 478 个 DocCases；部分平台无适用行为的 cases 有 guard。SSR policy 39 种 × CSR/hydration 共 78 个系统 Chrome runs；server-road 注册表最终 35 个合同 × 三 tier。类型测试、Vite 集成、native performance entries、真实 TCP/SSE/请求取消另有独立测试。`bun run check` 通过。

## 扩量属性活动

| 活动 | 每个模式的生成数量 | 每个模式的系统 Chrome runs | seed |
| --- | ---: | ---: | ---: |
| 随机组件树 | 200 棵，16 种节点 | 1,462 | 20261007 |
| 状态转换 | 80 生成 + 8 固定 spine = 88 | 440 | 20261008 |
| Router 操作属性 | 20 生成 + 9 spine = 29 | 145 | 20261010 |
| Router 功能场景 | 20 生成 + 9 spine = 29 | 58 | 固定活动 |
| 真实 SSE source 生命周期 | 20 生成 + 40 spine = 60 | 60 | 20261009 |

上述活动均在 development 和 production 执行；组件树是同一批 200 棵跨模式对照，不称 400 棵不同树。状态转换每个模式命中既有 004 共 45 次，具体签名保留在 [development](wave3-transitions-wave3-dev.json) / [production](wave3-transitions-wave3-prod.json)，无未知失败。树和 router 属性没有新反例，shrinker 没有新的输入可缩减；所有新 finding 均另行手工缩减。Cheap router matching 另有 1,000 个匹配断言。默认套件的 100 棵树是常规再验证，不与 200 棵活动重复计数。

## 差异矩阵

共 52 个登记项：47 confirmed、2 duplicate、3 fixed-upstream。本轮新增 44 项（009–054 扣除两个保留号），其中 050 duplicate；053 是新增 HEAD-only 双构建差异，016 是新增 production-only 差异。既有 004/008 与新增 022/029 也仍是 HEAD 相对 rc.13 的回归；本轮没有旧 confirmed 转为 fixed-upstream。

完整 ID、状态、一行说明及 HEAD／rc.13／production 表见 [LEDGER](../LEDGER.md)，机器可读版为 [findings matrix](wave3-findings-matrix.json)。每项 README 给出一个命令、预期／实际、文档或运行时裁定、三仓 open/closed 去重与缩减过程。编号 037、043 是未达到 finding 门槛的保留号，不计发现。

代码及证据随 wave3 快进合并到本地 main；没有上游写入。

## 运行命令

`bun run upstream` 刷新并链接本 checkout 的 HEAD；`bun run vite:upstream` 刷新 Vite 集成。`bun test` 运行独立 Bun 子进程的默认全套，`BUILD_MODE=production bun test` 为生产全套。`bun run coverage` 重建清单，`bun run check` 验证 TypeScript；最小红例用各 finding README 中的单命令。`STRICT_FINDINGS=1 bun run docs` 不接受已登记错误。

默认 suite 使用文件进程边界和外部时限，单个 file 内保留刻意的多 bundle/公共通道对照。此前未经隔离的整套有挂起，原顺序四文件联合复跑却通过，尚未证明具体触发；不登记为新的框架 finding。

## 限制和 Wave 4 建议

类型测试和 SSR/runtime 测试使用各自真实 export 条件；dev-only warnings 或 observe records 不声称生产也会出现。某些已通过的 Bun test unit 在不适用模式主动跳过内部合同，不能据此称同数量 production diagnostics 声明通过。NoJS 表单测试验证明确的 host handleNoJS/decode/SSR-seed integration，没有宣称 Router 包自动提供全部服务器 glue。

Bun-only 未运行 Node、Deno、workerd；本地 HTTP/1.1/SSE 不证明 HTTP/2 或中间代理配置；没有可构建的 Solid 2 SolidStart 发布版，测试的是核心/Vite 公共 server functions/components。绝对字节相等、内部零分配和 DevTools 面板最终视觉布局等无法从现有公开接口严格断言，逐项列入不可测试清单。async 排列有界采样，不代表穷举所有树。

Wave 4 优先在新的 HEAD 重放本轮最小红例并更新 fixed-upstream；将文档措辞/示例差异与运行时回归分开整理成人工确认的上游报告批次。随后扩充 compiler/Babel/native 编译器差分、production 浏览器事件序列与真实流式断线组合，并继续增加低成本生成案例。涉及其他 runtime 或 HTTP/2 的扩展需要先改变本项目 Bun-only 边界。
