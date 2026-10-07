import {costDiagnosticCases} from './cost-diagnostic-cases'
import {runCases} from './registry'
;(window as any).results=runCases(costDiagnosticCases.filter(c=>['08/cost-wasted-overlay-phases','08/cost-hot-fanout-milestones','08/cost-graph-growth-routes-subject'].includes(c.id)))
