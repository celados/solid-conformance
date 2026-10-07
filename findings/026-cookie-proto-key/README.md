---
type: Issue
id: '026'
status: confirmed
versions: [HEAD-53ef0e69]
area: HTTP/codec
upstream: []
found_by: docs
---

# Cookie parser 丢失合法的 __proto__ 名称

预期：RFC 12 说名字和值编码/解码对称，任何字符串可以 round-trip；合法 cookie 名称 __proto__ 对应的值应为字符串 x。实际：parser 对普通对象赋值 __proto__，结果不产生 own key，读取到的是 Object.prototype，而不是 x。

```sh
bun test ./findings/026-cookie-proto-key/repro.test.ts
```

来源：[12-ssr-http.md 第 236 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/12-ssr-http.md#cookies-the-codec-not-the-jar)。我们认为 runtime 错：该名称在 Cookie header 中合法，codec 不应该把数据键当作对象的特殊 setter。此处仅证明值丢失，不宣称 prototype pollution。

缩减：一个 parseCookieHeader 调用与 own-key/value 断言，无 SSR、DOM、request scope 或 store；文档 track 另用 serializeCookie 生成输入验证 round-trip，并在 client/server 两端执行。

去重：搜索三个仓库 open 与 closed 的 cookie __proto__、cookie prototype、parseCookieHeader。唯一邻近结果 [solid#3239](https://github.com/solidjs/solid/issues/3239) 讨论 flash cookie 属性与同名覆盖，已读正文；它不涉及普通对象特殊键丢值，机制不同。没有上游写入。
