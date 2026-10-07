import {costDiagnosticCases} from './cost-diagnostic-cases'
import {runCases} from './registry'
;(window as any).results=runCases(costDiagnosticCases.filter(c=>c.id==='08/cost-wasted-overlay-phases'))
