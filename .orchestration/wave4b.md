# Wave 4b — make the drafts maintainer-friendly (no upstream writes)

Review of report/issues/01: the facts are right, but the reproduction is not what a
maintainer will run first. Revise every Tier A proposal (and B/C items that carry code):

1. **Lead with a readable snippet.** Right after the one-paragraph summary, show the smallest
   component code that demonstrates the bug, formatted normally (Prettier-style, one statement
   per line, no compressed one-liners), with comments marking the action and the observation.
   For client-only bugs, make it paste-able into the Solid playground / a fresh
   `create-solid` app as-is; state the steps ("click X" or "wait") and what you see.
2. **Expected / Actual** as two short lines, then **Versions/builds** (HEAD sha, rc.13 status,
   dev/production).
3. **Full automated repro goes last**, in a collapsed `<details>` block, pointing to the
   standalone files in `report/repros/NN-*/`. Keep those files, reformatted for readability.
4. Remove harness jargon from issue text (no "oracle", "property", "finding", "track",
   "observe build" without a one-line explanation of what it is).
5. Keep each issue under ~60 lines of visible text before the `<details>` block.

Verify every snippet still reproduces (run the standalone repro on the refreshed HEAD) and
commit. Receipt: which proposals changed, and any whose snippet could not be reduced below
the full repro (say why).
