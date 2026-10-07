import {costDiagnosticCases} from './cost-diagnostic-cases'
import {runCases} from './registry'
;(window as any).results=runCases(costDiagnosticCases.filter(c=>['08/cost-wasted-overlay-phases','08/cost-hot-fanout-milestones','08/cost-graph-growth-routes-subject','08/cost-waterfall-default-duration','08/cost-waterfall-node-growth','08/cost-graph-series-leak-signatures','08/cost-engine-warning-gate','08/cost-checks-false'].includes(c.id)))
