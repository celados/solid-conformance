---
type: Issue
id: '030'
status: confirmed
versions: [HEAD-53ef0e69-types]
area: types/documentation
upstream: []
found_by: docs
---

# 文档把 effect error handler 写成第三个参数

预期：RFC 03 以 `createEffect(compute, effect, onError)` 描述 effect 的错误分支，该用法应符合公共签名。实际：第三个参数是 `EffectOptions`，传入函数时公开类型报 TS2559；runtime 的 error handler 实际属于第二个参数的 `{ effect, error }` bundle。

```sh
bun test ./findings/030-effect-error-signature/repro.test.ts
```

来源：[03-control-flow.md 第 169 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md#reporting-what-a-boundary-caught-the-client-error-hook)。我们认为文档括号中的签名错：正文所说「effect 自身 error arm 不通知 client hook」已由 `03/client-error-effect-arm` 在 dev/production 实测正确；应该把字面用法改为 bundle，而不是增加另一种 API。

缩减：两行 TypeScript，仅 import 与三参数调用，无 store、async、DOM、owner 或 runtime 执行。测试要求合法文档用法编译成功，不将 TS2559 当预期成功；类型 fixture 不参与主项目编译。

去重：三个仓库 open/closed 搜索 createEffect onError signature、createEffect error third argument、EffectOptions error callback，均无结果；详见 dedupe.json。没有上游写入。
