import {primitiveDiagnosticCases} from './primitive-diagnostic-cases'
import {costDiagnosticCases} from './cost-diagnostic-cases'
import {clientDiagnosticCases} from './client-diagnostic-cases'
import {serverDiagnosticCases} from './server-diagnostic-cases'
import {runCases} from './registry'
void runCases([...primitiveDiagnosticCases,...costDiagnosticCases,...clientDiagnosticCases,...serverDiagnosticCases]).then(results=>{(window as any).primitiveResults=results})
