import {primitiveDiagnosticCases} from './primitive-diagnostic-cases'
import {costDiagnosticCases} from './cost-diagnostic-cases'
import {runCases} from './registry'
void runCases([...primitiveDiagnosticCases,...costDiagnosticCases]).then(results=>{(window as any).primitiveResults=results})
