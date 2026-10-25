import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { loadDistribution, loadUpstream, readJson } from '../../scripts/lib/common.js'
import {
  validateActivationInventory,
  validateBehavior,
  validateCompatibilityMatrix,
  validateResultDocument,
  validateWorkflowInventory,
  type ResultContext,
} from '../../scripts/validate-behavior.js'

interface TestInventory {
  cases: Array<Record<string, unknown>>
}

interface TestMatrix {
  surfaces: Array<Record<string, unknown>>
}

const root = process.cwd()
const distribution = loadDistribution(root)
const upstream = loadUpstream(root)
const activationPath = path.join(root, 'tests', 'activation', 'cases.json')
const workflowPath = path.join(root, 'tests', 'workflows', 'cases.json')
const matrixPath = path.join(root, 'tests', 'compatibility', 'matrix.json')

function activationDocument(): TestInventory {
  return structuredClone(readJson<TestInventory>(activationPath))
}

function workflowDocument(): TestInventory {
  return structuredClone(readJson<TestInventory>(workflowPath))
}

function resultContext(): ResultContext {
  const activation = validateActivationInventory(root, upstream, readJson<unknown>(activationPath))
  const workflows = validateWorkflowInventory(root, distribution, upstream, readJson<unknown>(workflowPath))
  const compatibility = validateCompatibilityMatrix(root, distribution, upstream, readJson<unknown>(matrixPath))
  return {
    distribution,
    upstream,
    compatibility,
    caseIds: new Set([...activation.cases, ...workflows.cases].map((testCase) => testCase.id)),
  }
}

function validResult(context: ResultContext): Record<string, unknown> {
  const surface = context.compatibility.surfaces[0]
  return {
    schemaVersion: 1,
    resultId: '2026-10-25-example-aaaaaaaa',
    packageVersion: upstream.distributionVersion,
    packageCommit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    upstreamVersion: upstream.upstreamPluginVersion,
    upstreamCommit: upstream.commit,
    host: distribution.host,
    surfaceId: surface.id,
    surface: surface.surface,
    hostVersion: '1.2.3',
    os: { name: 'Windows', version: '11', architecture: 'x64' },
    model: 'example-model-identifier',
    runAt: '2026-10-25T08:00:00Z',
    repetitions: 2,
    cases: [{
      caseId: 'adk-positive-explicit',
      status: 'pass',
      repetitions: 2,
      expected: 'Activate adk and load only declared references.',
      observed: 'Sanitized synthetic observation for schema validation.',
      evidence: 'Sanitized unit-test fixture; not a live result.',
    }],
    limitations: ['Unit-test schema fixture only; not evidence of host compatibility.'],
  }
}

describe('Stage 3 behavior inventory', () => {
  it('validates complete repository coverage without executing a host', () => {
    const summary = validateBehavior(root)
    expect(summary).toMatchObject({
      activation: 54,
      positive: 30,
      negative: 18,
      overlap: 6,
      entryPoints: distribution.host === 'codex' ? 3 : 12,
      comparisons: 3,
      safety: 7,
      workflows: distribution.host === 'codex' ? 13 : 22,
    })
    expect(summary.resultFiles).toBeGreaterThanOrEqual(0)
  })

  it('rejects duplicate IDs and missing positive categories', () => {
    const duplicate = activationDocument()
    duplicate.cases[1].id = duplicate.cases[0].id
    expect(() => validateActivationInventory(root, upstream, duplicate)).toThrow(/duplicate case IDs/)

    const missingCategory = activationDocument()
    missingCategory.cases[0].category = 'natural-language'
    expect(() => validateActivationInventory(root, upstream, missingCategory)).toThrow(/required positive category/)
  })

  it('requires an explicit preflight-only deployment boundary', () => {
    const invalid = workflowDocument()
    const deployment = invalid.cases.find((testCase) => testCase.id === 'safety-deployment-consent')
    if (!deployment) throw new Error('Deployment safety case missing from test fixture')
    deployment.executionPolicy = 'deploy-without-confirmation'
    expect(() => validateWorkflowInventory(root, distribution, upstream, invalid)).toThrow(/preflight-only/)
  })

  it('does not allow placeholder metadata to become tested compatibility', () => {
    const invalid = structuredClone(readJson<TestMatrix>(matrixPath))
    invalid.surfaces[0].supportState = 'tested'
    expect(() => validateCompatibilityMatrix(root, distribution, upstream, invalid)).toThrow(/tested rows require exact/)
  })

  it('validates result provenance and exact environment metadata', () => {
    const context = resultContext()
    const result = validResult(context)
    expect(() => validateResultDocument(root, context, result, 'unit-result.json')).not.toThrow()

    const invalid = structuredClone(result)
    invalid.model = 'unrecorded'
    expect(() => validateResultDocument(root, context, invalid, 'unit-result.json')).toThrow(/model must be exact/)

    const unknownCase = structuredClone(result)
    const cases = unknownCase.cases as Array<Record<string, unknown>>
    cases[0].caseId = 'not-a-real-case'
    expect(() => validateResultDocument(root, context, unknownCase, 'unit-result.json')).toThrow(/unknown case/)
  })
})
