import { harness } from '@celados/harness'
import { defineConfig } from 'vite-plus'

export default defineConfig({
	...harness({
		// Only the shared infrastructure is Solid code we maintain. Track cases
		// are probes: they write the documented patterns, and deliberately the
		// mistaken ones, to observe Solid's behavior.
		solid: ['harness/**'],
		// Test components here are deliberate probes of Solid's behavior, and
		// fixtures render no real page: the a11y rules do not apply.
		a11yExclude: ['harness/**', 'tracks/**', 'findings/**'],
		ignore: [
			// Findings, evidence and report repros are minimal failing programs,
			// each constructed to show a discrepancy: lint would "fix" the repro.
			'findings/**',
			'evidence/**',
			// Agent run prompts and receipts.
			'.orchestration/**',
			'report/**',
			// Locked upstream snapshots and build output.
			'.upstream/**',
			'.scratch/**',
			'.build/**',
			'artifacts/**',
		],
	}),
	run: { cache: true },
})
