# Solid 2 conformance

A conformance test suite for Solid 2: client rendering, streaming SSR, hydration, async state transitions, documented APIs, and transport lifecycle. Tests record discrepancies; this repository does not patch Solid.

- [report/](report/README.md): proposed upstream reports, in filing order. Nothing has been filed.
- [report/repros/](report/repros/): standalone reproductions, each with a README and a one-command Bun runner for rc.13 or a built next checkout.
- [findings/](findings/): original minimal failing tests and evidence; [LEDGER.md](LEDGER.md) indexes their status.
- [harness/](harness/) and [tracks/](tracks/): shared infrastructure and regression/generated/documentation coverage.

Start with the README in the report's linked reproduction directory. Browser examples use **system Google Chrome**, never a downloaded Chromium.

For the full suite:

```sh
bun install --frozen-lockfile
bun run upstream
bun test
```

Bun and system Chrome are required; building next also requires Rust. Reproduction tests deliberately fail when the reported behavior is present; a green default suite may recognize recorded discrepancies. Full commands and coverage notes: [RUNNING.md](RUNNING.md).
