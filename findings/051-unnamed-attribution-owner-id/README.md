---
type: Issue
id: '051'
status: confirmed
versions:
  - rc.13 development
  - HEAD 53ef0e69 development
  - "rc.15 development"
  - "rc.15 production"
  - "HEAD e371645 development"
  - "HEAD e371645 production"
area: diagnostics/attribution
upstream:
  - https://github.com/solidjs/solid/issues/3063
found_by: docs
---

# 未命名节点的诊断名称不回退到 owner id

RFC08 L1234 声明 “Unnamed nodes fall back to their owner id.”。公开 `createRoot` 的命名 owner 下，未传 `name` 的 memo 记录为 `anonymous`，空 `name` 记录为空字符串，均没有使用该 memo 的公开 `getOwner().id`；显式 `name: 'named'` 正控正确。

```sh
bun test ./findings/051-unnamed-attribution-owner-id/repro.test.ts
```

倾向文档错误：运行时采用节点 name 或匿名标签，本句承诺的 owner id 回退未实现。收缩为一个命名 root 内的 signal/memo，单次写入和 native attribution 记录；两个未命名形状与显式命名正控没有 DOM、网络或异步。

三仓 open/closed 排重的完整结果见 `evidence/dedupe.json`。相关 closed #3063 要求 Universal 公共 API 接受显式诊断名称，不涉及未命名节点的 owner id 回退，正文见 `evidence/issue3063.json`；其他命中为 HMR 阈值、hydration id 或性能对比，不是同一合同。生产构建没有 attribution 记录，不在本合同范围内。

rc.13 的独立 dev 对照同签名失败，原始日志见 evidence/wave3-finding017051-rc13.log。production 不保留这个观测 API，记为不适用。

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: still fails; inspect retained assertion and controls; production: still fails; inspect retained assertion and controls. Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

## Wave 5 filing bar

**held**: Unnamed diagnostic labels only.
