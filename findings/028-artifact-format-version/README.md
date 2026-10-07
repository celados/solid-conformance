---
id: '028'
status: confirmed
versions: [HEAD-dev, HEAD-observe]
area: diagnostics/docs
upstream: []
found_by: docs
---

# artifact 格式版本说明落后

文档 `08-dev-diagnostics.md` L898 明确写 `captureArtifact` 的格式为 v7。实际公开 API 返回 `formatVersion: 8`，多出的 recovery 表也有专门的运行时覆盖。

运行：`bun test ./findings/028-artifact-format-version/repro.test.ts`。

认为文档应改：格式应升级以容纳新增 recovery；对解析 artifact 的消费者，准确的协议版本本身就是合同。production 不提供 OBSERVE，此合同不适用。

缩减为 `captureArtifact(() => 0, { attribution: false })` 的版本字段，删除所有渲染、attribution、record listeners 和浏览器操作。三仓 open/closed 搜索 `artifact formatVersion`、`diagnostics format v7` 无命中；证据见 `evidence/wave3-finding028-dedupe.json`，没有上游写入。
