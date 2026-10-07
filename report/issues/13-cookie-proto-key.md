---
type: Issue
title: "Cookie parser loses the valid __proto__ cookie name"
status: draft
tier: A
severity: low
findings: ['026']
target: dafad1db34626feb5f154e98e599f65be1802c6c
---

# Cookie parser loses the valid __proto__ cookie name

Parsing __proto__=x should return an own string-valued property; it returns Object.prototype instead. This demonstrates value loss, not prototype pollution.

## Reproduction

In an empty Bun project, create the files below. No conformance-harness imports are needed. Browser cases use the installed system Google Chrome, not a downloaded browser. The rc.13 command is the comparison baseline; to reproduce HEAD, replace the five Solid packages with the matching built distributions from `solidjs/solid` commit `dafad1db34626feb5f154e98e599f65be1802c6c`. Do not mix package generations. 

```sh
bun init -y
bun add solid-js@2.0.0-rc.13 @solidjs/web@2.0.0-rc.13 @solidjs/signals@2.0.0-rc.13 @solidjs/compiler@2.0.0-rc.13 @solidjs/diagnostics@2.0.0-rc.13
bun add -d playwright
BUILD_MODE=development bun test ./repro.test.ts
```

### `repro.test.ts`

```ts
import { test, expect } from 'bun:test'
import { parseCookieHeader } from '@solidjs/web'

test('12-ssr-http.md: valid cookie names including __proto__ decode to their string value',()=>{
 const cookies=parseCookieHeader('__proto__=x')
 expect(Object.hasOwn(cookies,'__proto__')).toBe(true)
 expect(cookies['__proto__']).toBe('x')
})
```

## Expected versus actual

Parsing __proto__=x should return an own string-valued property; it returns Object.prototype instead. This demonstrates value loss, not prototype pollution.

## Versions and builds

Both builds fail; rc.13 also fails. The original failing snapshot was `53ef0e69`; the refresh target is `dafad1db34626feb5f154e98e599f65be1802c6c`. Refresh disposition is recorded in the batch index before filing.

## Related issues

[#3239](https://github.com/solidjs/solid/issues/3239)

Local evidence: [finding 026](../../findings/026-cookie-proto-key/README.md).
