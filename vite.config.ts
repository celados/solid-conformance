import { harness } from '@celados/harness'
import { defineConfig } from 'vite-plus'

export default defineConfig({
	...harness({
		solid: ['harness/**', 'tracks/**', 'suite/**'],
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
