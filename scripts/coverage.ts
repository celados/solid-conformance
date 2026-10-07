// Generate the covered-statement inventory from a completed docs receipt.
const receipt = await Bun.file(process.argv[2] ?? 'artifacts/docs-head-development.json').json()
const results = receipt.results as { id: string; file: string; statement: string; error?: string; platform: string }[]
const unique = [...new Map(results.map(r => [r.id, r])).values()].sort((a,b)=>a.id.localeCompare(b.id))
const revision = receipt.runtime.upstream.revision
const statements = new Set(unique.map(r => r.file + ':' + r.statement)).size
const text = `---
type: Reference
title: Wave 2 RFC coverage inventory
status: partial
upstream_commit: ${revision}
description: 已执行 statement、文档差异和未完成审计的覆盖缺口。
---

# 文档覆盖

来源：[Solid next documentation/solid-2.0](https://github.com/solidjs/solid/tree/${revision}/documentation/solid-2.0)。每个注册项保留文件名与行为句子，runner 将逐项结果写入 JSON。当前 ${unique.length} 个唯一 case ID，按文件与句子去重后 ${statements} 个行为声明，${results.length} 个适用的 client/server 执行结果。

**covered / total：${statements} / 未完成全文逐句盘点。** 这里不是 ${statements}/${statements} 的全覆盖证明；已登记的断言均有可执行测试，但这轮没有完成原工作单要求的所有 behavioral statements。下表是已覆盖部分的准确索引。

## 章节与缺口

| 章节 | 已登记 ID | 待补测试 |
| --- | ---: | --- |
${Array.from({length:12},(_,i)=>{const ch=String(i+1).padStart(2,'0');const counts=unique.filter(r=>r.id.startsWith(ch+'/')).length;const gaps:Record<string,string>={'01':'其他 options、equality、reaction 与取消组合','02':'更广的 derived source/owner 组合','03':'嵌套 Reveal、复合 reset、动态组件切换','04':'多层 keyed reconcile、更多浅边界与 path 模式','05':'server-source adoption / client takeover 全矩阵、fetch replay','06':'多个 action 并发、嵌套 until 与 authority 组合','07':'style/spread、自定义事件与完整 element-claim 生命周期','08':'大部分 diagnostics、OBSERVE.records、attribution 与性能轨道','09':'类型／JSX ownership：未实现 dedicated compile fixtures','10':'客户端 RPC roundtrip、live/reconnect、rich args、single-flight','11':'实验性 server components：未实现 transport/slot/adoption 轨道','12':'背压、断连及流式错误 takeover 更广组合'};return '| '+ch+' | '+counts+' | '+gaps[ch]+' |'}).join('\n')}

README、MIGRATION 和 _template 的导航／写作约定未计为新的运行时契约；其中迁移行为应映射回对应 RFC，不应以这种去重方式遗漏行为。

## 不可直接转成确定性行为断言的内容

历史性能数字（KB、benchmark 提速）缺少固定构建输入和测量平台；future/open question 与尚未发布的 stabilization 计划不是当前行为；Chrome DevTools 面板的视觉排列依赖浏览器 UI 版本。它们需分别做固定条件 benchmark、后续实现追踪和人工／UI 验证，不计为已覆盖。上表待补项都是可测试的缺口，不能归为不可测试。

## 已执行 statement

断言定义在 core-cases.ts、render-cases.tsx、http-cases.tsx、rpc-cases.ts；docs.test.ts 在真实 Chrome 和独立 SSR artifact 上统一执行。已知失败的原始 error 保留在 receipt，默认只接受具体签名；STRICT_FINDINGS=1 禁用该识别。

| ID | RFC 文件 | 行为句子 | 执行平台 |
| --- | --- | --- | --- |
${unique.map(r=>'| '+r.id+' | ['+r.file+'](https://github.com/solidjs/solid/blob/'+revision+'/documentation/solid-2.0/'+r.file+') | '+r.statement.replaceAll('|','\\|')+' | '+results.filter(x=>x.id===r.id).map(x=>x.platform).join(', ')+' |').join('\n')}
`
await Bun.write('tracks/docs/COVERAGE.md', text)
export {}
