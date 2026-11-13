import { runCases } from './registry'
import { serverDiagnosticCases } from './server-diagnostic-cases'
export const run = () => runCases(serverDiagnosticCases)
