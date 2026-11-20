---
type: Verification
title: Wave 6 conformance receipt
---

Tested published Solid 2.0.3, compiler 2.0.2, router 2.0.1 and Solid main 99db9bce45b94b07bb790f04bb3f0eff6844b562 built with Bun. The user authorized filing verified bugs directly this wave.

- Both targets passed eight generated trees each (seed 20261120, 58 browser runs each), including streamed hydration, CSR, settle permutations and iterator disposal.
- Held UI passed 20 release cases and 100 main cases. Held mount passed 100 per target. Neither track hit its known exceptions. Main passed 24 transition scenarios (120 browser runs) including supersession, rejection, remount, action failure and derived stores. Independent sibling requests committed in either resolution order on both targets.
- #5108 reproduced with a plain client promise rendered directly as text. On release the hydrated flag stayed false throughout two seconds. On main the overview disappeared around 130 ms and returned with the flag around 1029 ms. Replacing the inner Show with Switch/Match retained the original symptom. A single Show, a ternary or a direct list read preserved the overview in the tested main traces. No separate defect established. Existing issue received the reduced repro.
- 058/059 on main restored the DOM and ref title. The observed strict-read diagnostics describe reading the accessor inside a ref. No new application failure. The historical wrappers reinstalled rc.21 and launched their old browser channel, so their failures were excluded. The current-target checks used bundled Chromium.
- Scope was bounded by the listed seeds and scenarios. The full historical suite, production matrix and router HEAD were not run.
