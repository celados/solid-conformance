---
type: Issue
id: '042'
status: confirmed
versions:
  - "rc.13 development"
  - HEAD 53ef0e69 development
area: diagnostics/SSR/head
upstream: []
found_by: docs-to-tests
---

# 非字符串 preload crossorigin 没有诊断

预期 asset manifest 的 `crossorigin: 42` 触发 `PRELOAD_DESCRIPTOR_INVALID`，因为文档明确承诺校验 malformed crossorigin。实际值被字符串化并发出 `crossorigin="42"`，没有诊断；同一路径 font 缺少 crossorigin 的正控发出一条，合法 `anonymous` 及生产负控均安静。

```sh
bun test ./findings/042-malformed-preload-crossorigin/repro.test.ts
BUILD_MODE=production bun test ./findings/042-malformed-preload-crossorigin/repro.test.ts
```

[08-dev-diagnostics.md L680](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#preload_descriptor_invalid) 将 malformed `imagesrcset`、`imagesizes`、`crossorigin` 列为诊断并丢弃链接或字段的情形。TypeScript 不接受数字；本 repro 通过 `as any` 模拟来自外部 manifest 的错误输入，检测 runtime 明确承诺的校验。HTML 自身会将无效 CORS 字符串按 anonymous 处理，所以这不是资源错误请求的指控。倾向文档措辞过强：若设计刻意采用 HTML 归一化，应将 malformed crossorigin 改成 font/fetch 缺少 CORS 模式。

## 缩减与去重

一个 lazy 页面注册一个 font preload；没有状态、actions、客户端或异步时序竞争。保留 missing 正控与合法字符串负控，避免误将 disabled 检测当失败。三仓 open/closed 搜索 `crossorigin preload` 均无结果，现有 findings 无同机制。证据在 `evidence/wave3-finding042-*`；rc.13 由主线程统一比较。

Wave 3 独立版本对照：rc.13 development 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
