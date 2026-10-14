---
id: '036'
status: fixed-upstream
versions: ["HEAD 53ef0e69 development", "HEAD 53ef0e69 observe", "HEAD 53ef0e69 production", "rc.13 development", "rc.13 production"]
area: server-functions/HTTP/cache
upstream:
  - https://github.com/solidjs/solid/issues/3101
  - https://github.com/solidjs/solid/issues/3134
found_by: docs
---

# Conditional GET replaces cached data's format with Void

RFC10 L168:1 promises a GET-declared read with ETag/Cache-Control lets the browser revalidate and replay cached data. Chrome does precisely that, but the server-function caller receives `undefined` on the second read instead of the first `{value:17}`.

Run: `bun test ./findings/036-conditional-cache-format/repro.test.ts`.
The same command with `BUILD_MODE=observe` or `BUILD_MODE=production` also fails.

The runtime appears wrong. The first response has `X-Server-Function-Format: 8` (JSON); the origin's bodyless 304 carries `9` (Void). Chrome merges the 304's headers into its cached 200, so the transport sees status 200 with the original body but the new Void format and returns no data. Both successful fetch statuses, the cached first value, and origin request headers are asserted before the failing value oracle. A cache update must preserve the cached representation's protocol metadata.

The fixture uses public GET/reference/handler/response helpers and real system Google Chrome. The application does not supply `If-None-Match`; Chrome sends it itself, confirmed by the origin receiving `[null, '"constant"']`. Both responses carry the same authored cache policy, avoiding destructive no-store defaults. No router, UI tree, hydration, action or shared cache is needed. The custom fetch only records statuses and format fields.

Open and closed searches across solidjs/solid, solid-router and solid-start for 304/conditional found the related issues above. #3101 reproduces a scripted caller directly seeing a 304 and explicitly recommends this browser-managed GET path. Here JavaScript receives 200, as intended; its cached body is misclassified by merged protocol headers. #3134 fixes an injected no-store that evicts the cache; this fixture echoes the cache policy and still fails. Neither reports this format-field replacement mechanism. The rc.13 comparison is recorded by the subsequent Wave 3 verification paragraph and its raw baseline logs; the old pending note is superseded.

rc.13 开发／生产独立对照仍红，原始结果：evidence/solid-wave3-033035-rc13.log、solid-wave3-036038-rc13.log、solid-wave3-034044-rc13-prod.log。

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: passes (a zero-test tier is not applicable); production: passes (a zero-test tier is not applicable). Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

The original desired-behavior test passes in rc.15. Fix: [a14c18b](https://github.com/solidjs/solid/commit/a14c18b68f75138899829eb76d5661a8ead3af7c), included in the rc.15 release. Original failing versions remain above as historical provenance.

## Wave 5 filing bar

**excluded-fixed**: Desired-behavior repro passes in the latest tested runtime; historical failing versions retained.
