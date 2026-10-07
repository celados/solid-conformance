---
type: Review
title: Independent review resolutions
status: resolved
---

# Review resolutions

The read-only Opus 5.5 review is retained in independent-review.md. The following revisions were made without changing a desired-behavior assertion into a passing expectation:

- Added direct upstream issue URLs to every B/C item; local validation links are explicitly review-only. A local links are likewise marked for omission when filing.
- Unified 032/036 at med; corrected FRAME_MARKER_CORRUPTED and the documentation-first interpretation of plain-signal leaf creation (010).
- Removed the consumer Seroval pin from 04; recorded the linked HEAD's actual 1.6.8 dependency. Shared-cause wording remains suspected, without a runtime patch.
- Added an EOF branch to 04's inline and companion test. Both body error and EOF pass codec/transport controls before the pending-pull failure (two tests, six assertions).
- Added the production tree-shaking-off control and printed the actual rejection in 05. It fails with tree shaking and passes when tree shaking/DCE annotations are disabled. Mangled property spelling is no longer presented as a stable contract.
- Replaced the “never settles” wording in 02 with the observed 200 ms watchdog result; noted 004's independently checked LiveSource sibling without inflating the smaller CSR example.
- Resolved stale baseline notes by supplementary rc.13 checks for 009/011/014/016/020/022/029/032 and 031, with raw logs. Existing 035/036/038 baseline verification paragraphs supersede their old pending notes.
- Clarified duplicate build scope as un-rechecked historical red evidence; made 027 an explicit B classification exception for RFC11 publishing-policy prose.
- Added both RFC01 untrack passages, balanced the disputed accessor interpretation of 007, recorded the conditional-GET warning symptom, and cross-referenced 027/045's shared paragraph.
- Corrected 031's impact description: the issue is request-local precedence over the ambient-only prose, not missing error handling outside a request.

47 findings remain covered exactly once. A16/B16/C15 and 27 proposed issues are unchanged. No upstream action was taken.
