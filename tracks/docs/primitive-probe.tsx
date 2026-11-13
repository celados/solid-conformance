import { clientDiagnosticCases } from './client-diagnostic-cases'
import { costDiagnosticCases } from './cost-diagnostic-cases'
import { primitiveDiagnosticCases } from './primitive-diagnostic-cases'
import { runCases } from './registry'
import { serverDiagnosticCases } from './server-diagnostic-cases'
void runCases([
	...primitiveDiagnosticCases,
	...costDiagnosticCases,
	...clientDiagnosticCases,
	...serverDiagnosticCases,
]).then((results) => {
	;(window as any).primitiveResults = results
})
