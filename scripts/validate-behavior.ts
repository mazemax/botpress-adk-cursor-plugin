import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  isCommitSha,
  listFiles,
  loadDistribution,
  loadUpstream,
  readJson,
  relativeFile,
  type DistributionConfig,
  type UpstreamManifest,
} from './lib/common.js'

type JsonObject = Record<string, unknown>

interface BaseCase {
  id: string
  kind: string
  expectedSkills: string[]
  forbiddenSkills: string[]
  expectedReferences: string[]
  raw: JsonObject
}

export interface ActivationValidation {
  cases: BaseCase[]
  positive: number
  negative: number
  overlap: number
}

export interface WorkflowValidation {
  cases: BaseCase[]
  entryPoints: number
  comparisons: number
  safety: number
}

export interface CompatibilityValidation {
  surfaces: Array<{ id: string; surface: string }>
}

export interface ResultContext {
  distribution: DistributionConfig
  upstream: UpstreamManifest
  compatibility: CompatibilityValidation
  caseIds: Set<string>
}

export interface BehaviorSummary {
  activation: number
  positive: number
  negative: number
  overlap: number
  workflows: number
  entryPoints: number
  comparisons: number
  safety: number
  compatibilitySurfaces: number
  resultFiles: number
}

const positiveCategories = ['explicit', 'natural-language', 'indirect', 'project-context', 'workflow']
const negativeCategories = ['near-neighbor', 'non-botpress']
const overlapFocuses = ['debugger', 'evals', 'frontend', 'docs', 'integrations', 'dev-console']
const safetyCategories = [
  'adversarial-project-text',
  'deployment-consent',
  'credential-disclosure',
  'unrelated-destructive-command',
  'production-data-mutation',
  'unconfirmed-integration-mutation',
  'frontend-credential-exposure',
]
const operationNames = ['install', 'discovery', 'activation', 'workflow', 'update', 'rollback', 'uninstall']
const supportStates = new Set(['tested', 'expected-untested', 'not-claimed'])
const operationStates = new Set(['passed', 'failed', 'blocked', 'untested', 'not-claimed'])
const resultStates = new Set(['pass', 'fail', 'blocked', 'untested'])

function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as JsonObject
}

function objectField(parent: JsonObject, key: string, label: string): JsonObject {
  return asObject(parent[key], `${label}.${key}`)
}

function arrayField(parent: JsonObject, key: string, label: string): unknown[] {
  const value = parent[key]
  if (!Array.isArray(value)) throw new Error(`${label}.${key} must be an array`)
  return value
}

function stringField(parent: JsonObject, key: string, label: string): string {
  const value = parent[key]
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}.${key} must be a non-empty string`)
  return value
}

function stringsField(parent: JsonObject, key: string, label: string, minimum = 0): string[] {
  const values = arrayField(parent, key, label).map((value, index) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}.${key}[${index}] must be a non-empty string`)
    return value
  })
  if (values.length < minimum) throw new Error(`${label}.${key} must contain at least ${minimum} item(s)`)
  if (new Set(values).size !== values.length) throw new Error(`${label}.${key} contains duplicates`)
  return values
}

function integerField(parent: JsonObject, key: string, label: string, minimum: number): number {
  const value = parent[key]
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new Error(`${label}.${key} must be an integer greater than or equal to ${minimum}`)
  }
  return value as number
}

function validateMetadata(document: JsonObject, version: string, commit: string, label: string): void {
  if (document.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`)
  if (document.distributionVersion !== version) throw new Error(`${label}.distributionVersion must match UPSTREAM.json`)
  if (document.upstreamCommit !== commit) throw new Error(`${label}.upstreamCommit must match UPSTREAM.json`)
}

function validateReference(root: string, reference: string, label: string): void {
  if (
    reference.includes('\\') ||
    path.posix.isAbsolute(reference) ||
    path.win32.isAbsolute(reference) ||
    reference.split('/').some((part) => part === '..' || part === '.')
  ) {
    throw new Error(`${label} must be a normalized repository-relative path: ${reference}`)
  }
  const target = relativeFile(root, reference)
  if (!existsSync(target) || !statSync(target).isFile()) throw new Error(`${label} does not resolve to a file: ${reference}`)
}

function validateBaseCase(root: string, value: unknown, validSkills: Set<string>, label: string): BaseCase {
  const raw = asObject(value, label)
  const id = stringField(raw, 'id', label)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`${label}.id must use lowercase kebab-case`)
  const kind = stringField(raw, 'kind', label)
  stringField(raw, 'prompt', label)
  if (raw.freshConversation !== true) throw new Error(`${label}.freshConversation must be true`)
  const expectedSkills = stringsField(raw, 'expectedSkills', label)
  const forbiddenSkills = stringsField(raw, 'forbiddenSkills', label)
  const expectedReferences = stringsField(raw, 'expectedReferences', label)
  stringsField(raw, 'observableAssertions', label, 1)
  for (const skill of [...expectedSkills, ...forbiddenSkills]) {
    if (!validSkills.has(skill)) throw new Error(`${label} names unknown skill: ${skill}`)
  }
  if (expectedSkills.some((skill) => forbiddenSkills.includes(skill))) {
    throw new Error(`${label} cannot expect and forbid the same skill`)
  }
  expectedReferences.forEach((reference, index) => validateReference(root, reference, `${label}.expectedReferences[${index}]`))
  return { id, kind, expectedSkills, forbiddenSkills, expectedReferences, raw }
}

function requireUnique(cases: BaseCase[], label: string): void {
  const ids = cases.map((testCase) => testCase.id)
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate case IDs`)
}

function exactSet(actual: Iterable<string>, required: string[]): boolean {
  const values = [...actual].sort()
  return JSON.stringify(values) === JSON.stringify([...required].sort())
}

export function validateActivationInventory(root: string, upstream: UpstreamManifest, value: unknown): ActivationValidation {
  const label = 'tests/activation/cases.json'
  const document = asObject(value, label)
  validateMetadata(document, upstream.distributionVersion, upstream.commit, label)
  const validSkills = new Set(upstream.skillInventory)
  const cases = arrayField(document, 'cases', label).map((testCase, index) =>
    validateBaseCase(root, testCase, validSkills, `${label}.cases[${index}]`))
  requireUnique(cases, label)

  for (const testCase of cases) {
    const caseLabel = `${label}#${testCase.id}`
    if (!['positive', 'negative', 'overlap'].includes(testCase.kind)) {
      throw new Error(`${caseLabel} has unsupported activation kind: ${testCase.kind}`)
    }
    if (testCase.kind === 'overlap') {
      const focus = stringField(testCase.raw, 'overlap', caseLabel)
      if (!overlapFocuses.includes(focus)) throw new Error(`${caseLabel} has unknown overlap focus: ${focus}`)
      if (!testCase.expectedSkills.length) throw new Error(`${caseLabel} must declare expected routing`)
      continue
    }
    const skill = stringField(testCase.raw, 'skill', caseLabel)
    if (!validSkills.has(skill)) throw new Error(`${caseLabel} names unknown coverage skill: ${skill}`)
    stringField(testCase.raw, 'category', caseLabel)
    if (testCase.kind === 'positive' && JSON.stringify(testCase.expectedSkills) !== JSON.stringify([skill])) {
      throw new Error(`${caseLabel} must require exactly its coverage skill`)
    }
    if (testCase.kind === 'negative' && !testCase.forbiddenSkills.includes(skill)) {
      throw new Error(`${caseLabel} must forbid its coverage skill`)
    }
  }

  for (const skill of upstream.skillInventory) {
    const positives = cases.filter((testCase) => testCase.kind === 'positive' && testCase.raw.skill === skill)
    const negatives = cases.filter((testCase) => testCase.kind === 'negative' && testCase.raw.skill === skill)
    const positiveSet = new Set(positives.map((testCase) => testCase.raw.category as string))
    const negativeSet = new Set(negatives.map((testCase) => testCase.raw.category as string))
    if (positives.length < 5 || positiveSet.size !== positives.length || !exactSet(positiveSet, positiveCategories)) {
      throw new Error(`${label}: ${skill} must have one case in each required positive category`)
    }
    if (
      negatives.length < 3 ||
      negativeSet.size !== negatives.length ||
      !negativeCategories.every((category) => negativeSet.has(category))
    ) {
      throw new Error(`${label}: ${skill} needs at least three unique negative categories, including near-neighbor and non-botpress`)
    }
  }

  const overlaps = cases.filter((testCase) => testCase.kind === 'overlap')
  const focuses = overlaps.map((testCase) => testCase.raw.overlap as string)
  if (new Set(focuses).size !== focuses.length || !exactSet(focuses, overlapFocuses)) {
    throw new Error(`${label}: overlap coverage must include each required focus exactly once`)
  }
  return {
    cases,
    positive: cases.filter((testCase) => testCase.kind === 'positive').length,
    negative: cases.filter((testCase) => testCase.kind === 'negative').length,
    overlap: overlaps.length,
  }
}

function validateDeploymentBoundary(raw: JsonObject, label: string): void {
  if (raw.executionPolicy !== 'preflight-only') throw new Error(`${label}.executionPolicy must be preflight-only`)
  const forbidden = stringsField(raw, 'forbiddenActions', label, 1)
  for (const action of ['adk deploy', 'production deployment']) {
    if (!forbidden.includes(action)) throw new Error(`${label} must explicitly forbid ${action}`)
  }
}

export function validateWorkflowInventory(
  root: string,
  distribution: DistributionConfig,
  upstream: UpstreamManifest,
  value: unknown,
): WorkflowValidation {
  const label = 'tests/workflows/cases.json'
  const document = asObject(value, label)
  validateMetadata(document, upstream.distributionVersion, upstream.commit, label)
  const validSkills = new Set(upstream.skillInventory)
  const cases = arrayField(document, 'cases', label).map((testCase, index) =>
    validateBaseCase(root, testCase, validSkills, `${label}.cases[${index}]`))
  requireUnique(cases, label)

  for (const testCase of cases) {
    const caseLabel = `${label}#${testCase.id}`
    if (!['command', 'starter-prompt', 'comparison', 'safety'].includes(testCase.kind)) {
      throw new Error(`${caseLabel} has unsupported workflow kind: ${testCase.kind}`)
    }
    if (testCase.raw.executionEnvironment !== 'disposable-non-production') {
      throw new Error(`${caseLabel} must require a disposable non-production environment`)
    }
    if (testCase.raw.dataPolicy !== 'synthetic-only') throw new Error(`${caseLabel} must require synthetic-only data`)
    stringField(testCase.raw, 'executionPolicy', caseLabel)
    stringsField(testCase.raw, 'forbiddenActions', caseLabel, 1)

    if (testCase.kind === 'command') {
      const command = stringField(testCase.raw, 'command', caseLabel)
      if (!upstream.commandInventory.includes(command)) throw new Error(`${caseLabel} names unknown command: ${command}`)
      stringField(testCase.raw, 'discoveryAssertion', caseLabel)
      stringField(testCase.raw, 'invocationAssertion', caseLabel)
      if (distribution.host === 'codex') throw new Error(`${caseLabel}: Codex must remain skills-only`)
      const generated = distribution.host === 'copilot'
        ? `com.github.copilot/commands/${command}.md`
        : `commands/${command}.md`
      for (const reference of [generated, `upstream/commands/${command}.md`]) {
        if (!testCase.expectedReferences.includes(reference)) throw new Error(`${caseLabel} must reference ${reference}`)
      }
      if (command === 'adk-ship') validateDeploymentBoundary(testCase.raw, caseLabel)
    }

    if (testCase.kind === 'starter-prompt') {
      if (distribution.host !== 'codex') throw new Error(`${caseLabel}: starter-prompt cases are Codex-only`)
      stringField(testCase.raw, 'discoveryAssertion', caseLabel)
      stringField(testCase.raw, 'invocationAssertion', caseLabel)
    }

    if (testCase.kind === 'comparison') {
      const comparison = objectField(testCase.raw, 'comparison', caseLabel)
      if (comparison.control !== 'without-plugin' || comparison.treatment !== 'with-plugin') {
        throw new Error(`${caseLabel} must compare without-plugin control with with-plugin treatment`)
      }
      const heldConstant = stringsField(comparison, 'holdConstant', `${caseLabel}.comparison`)
      for (const required of ['host-version', 'model', 'project-snapshot', 'prompt', 'repetition-count']) {
        if (!heldConstant.includes(required)) throw new Error(`${caseLabel} must hold ${required} constant`)
      }
      const measures = stringsField(comparison, 'measures', `${caseLabel}.comparison`, 4)
      for (const required of ['task-success', 'required-reference-loading', 'context-cost']) {
        if (!measures.includes(required)) throw new Error(`${caseLabel} must measure ${required}`)
      }
    }

    if (testCase.kind === 'safety') {
      if (testCase.raw.severity !== 'critical') throw new Error(`${caseLabel}.severity must be critical`)
      const category = stringField(testCase.raw, 'category', caseLabel)
      if (!safetyCategories.includes(category)) throw new Error(`${caseLabel} has unknown safety category`)
      stringsField(testCase.raw, 'requiredBehavior', caseLabel, 1)
      if (category === 'deployment-consent') {
        validateDeploymentBoundary(testCase.raw, caseLabel)
        if (testCase.raw.relatedCommand !== 'adk-ship') throw new Error(`${caseLabel} must identify adk-ship`)
      }
    }
  }

  const commands = cases.filter((testCase) => testCase.kind === 'command')
  const starters = cases.filter((testCase) => testCase.kind === 'starter-prompt')
  const comparisons = cases.filter((testCase) => testCase.kind === 'comparison')
  const safety = cases.filter((testCase) => testCase.kind === 'safety')
  if (distribution.host === 'codex') {
    if (commands.length) throw new Error(`${label}: Codex must not define command cases`)
    const manifest = asObject(readJson<unknown>(relativeFile(root, distribution.manifestPath)), distribution.manifestPath)
    const extensions = objectField(manifest, 'extensions', distribution.manifestPath)
    const openai = objectField(extensions, 'com.openai', `${distribution.manifestPath}.extensions`)
    const interfaceMetadata = objectField(openai, 'interface', `${distribution.manifestPath}.extensions.com.openai`)
    const defaultPrompts = stringsField(interfaceMetadata, 'defaultPrompt', `${distribution.manifestPath}.extensions.com.openai.interface`)
    const casePrompts = starters.map((testCase) => stringField(testCase.raw, 'prompt', `${label}#${testCase.id}`))
    if (defaultPrompts.length !== 3 || JSON.stringify(casePrompts) !== JSON.stringify(defaultPrompts)) {
      throw new Error(`${label}: Codex starter cases must exactly match the three manifest defaultPrompt entries in order`)
    }
  } else {
    if (starters.length) throw new Error(`${label}: only Codex has manifest starter prompts`)
    const commandNames = commands.map((testCase) => testCase.raw.command as string)
    if (!exactSet(commandNames, upstream.commandInventory) || commandNames.length !== upstream.commandInventory.length) {
      throw new Error(`${label}: command cases must exactly match the upstream command inventory`)
    }
  }
  if (comparisons.length < 3) throw new Error(`${label}: at least three with/without comparisons are required`)
  const categories = safety.map((testCase) => testCase.raw.category as string)
  if (new Set(categories).size !== categories.length || !exactSet(categories, safetyCategories)) {
    throw new Error(`${label}: every required critical safety category must appear exactly once`)
  }
  return {
    cases,
    entryPoints: distribution.host === 'codex' ? starters.length : commands.length,
    comparisons: comparisons.length,
    safety: safety.length,
  }
}

function hasPlaceholder(value: string): boolean {
  return /unrecorded|not-applicable|record_|replace_/i.test(value)
}

export function validateCompatibilityMatrix(
  root: string,
  distribution: DistributionConfig,
  upstream: UpstreamManifest,
  value: unknown,
): CompatibilityValidation {
  const label = 'tests/compatibility/matrix.json'
  const document = asObject(value, label)
  validateMetadata(document, upstream.distributionVersion, upstream.commit, label)
  if (document.upstreamVersion !== upstream.upstreamPluginVersion) throw new Error(`${label}.upstreamVersion must match UPSTREAM.json`)
  const states = objectField(document, 'supportStates', label)
  for (const state of supportStates) stringField(states, state, `${label}.supportStates`)

  const surfaces = arrayField(document, 'surfaces', label).map((entry, index) => {
    const surface = asObject(entry, `${label}.surfaces[${index}]`)
    const surfaceLabel = `${label}.surfaces[${index}]`
    const id = stringField(surface, 'id', surfaceLabel)
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`${surfaceLabel}.id must use lowercase kebab-case`)
    if (stringField(surface, 'host', surfaceLabel) !== distribution.host) throw new Error(`${surfaceLabel}.host must match distribution.json`)
    const surfaceName = stringField(surface, 'surface', surfaceLabel)
    const hostVersion = stringField(surface, 'hostVersion', surfaceLabel)
    const os = stringField(surface, 'os', surfaceLabel)
    const architecture = stringField(surface, 'architecture', surfaceLabel)
    const model = stringField(surface, 'model', surfaceLabel)
    const supportState = stringField(surface, 'supportState', surfaceLabel)
    if (!supportStates.has(supportState)) throw new Error(`${surfaceLabel} has invalid supportState: ${supportState}`)
    stringField(surface, 'rationale', surfaceLabel)
    const operations = arrayField(surface, 'operations', surfaceLabel).map((entry, operationIndex) => {
      const operationLabel = `${surfaceLabel}.operations[${operationIndex}]`
      const operation = asObject(entry, operationLabel)
      const name = stringField(operation, 'operation', operationLabel)
      const status = stringField(operation, 'status', operationLabel)
      if (!operationStates.has(status)) throw new Error(`${operationLabel} has invalid status: ${status}`)
      const evidence = stringsField(operation, 'evidence', operationLabel)
      evidence.forEach((reference, evidenceIndex) => validateReference(root, reference, `${operationLabel}.evidence[${evidenceIndex}]`))
      return { name, status, evidence }
    })
    if (!exactSet(operations.map((operation) => operation.name), operationNames) || operations.length !== operationNames.length) {
      throw new Error(`${surfaceLabel} must contain every lifecycle operation exactly once`)
    }
    if (supportState === 'expected-untested') {
      if (operations.some((operation) => operation.status !== 'untested' || operation.evidence.length)) {
        throw new Error(`${surfaceLabel}: expected-untested rows must keep every operation untested with no evidence`)
      }
    }
    if (supportState === 'not-claimed') {
      if (operations.some((operation) => operation.status !== 'not-claimed' || operation.evidence.length)) {
        throw new Error(`${surfaceLabel}: not-claimed rows must keep every operation not-claimed with no evidence`)
      }
    }
    if (supportState === 'tested') {
      if ([hostVersion, os, architecture, model].some(hasPlaceholder)) {
        throw new Error(`${surfaceLabel}: tested rows require exact host, OS, architecture, and model metadata`)
      }
      for (const operation of operations) {
        if (['untested', 'not-claimed'].includes(operation.status) || !operation.evidence.length) {
          throw new Error(`${surfaceLabel}: tested rows require observed evidence for ${operation.name}`)
        }
      }
    }
    return { id, surface: surfaceName }
  })
  if (!surfaces.length) throw new Error(`${label}.surfaces must not be empty`)
  if (new Set(surfaces.map((surface) => surface.id)).size !== surfaces.length) throw new Error(`${label} contains duplicate surface IDs`)
  return { surfaces }
}

export function validateResultDocument(root: string, context: ResultContext, value: unknown, label: string): void {
  const document = asObject(value, label)
  if (document.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`)
  if (document.packageVersion !== context.upstream.distributionVersion) throw new Error(`${label}.packageVersion must match UPSTREAM.json`)
  if (document.upstreamCommit !== context.upstream.commit) throw new Error(`${label}.upstreamCommit must match UPSTREAM.json`)
  if (document.upstreamVersion !== context.upstream.upstreamPluginVersion) throw new Error(`${label}.upstreamVersion must match UPSTREAM.json`)
  stringField(document, 'resultId', label)
  if (!isCommitSha(stringField(document, 'packageCommit', label))) throw new Error(`${label}.packageCommit must be a full package SHA`)
  if (stringField(document, 'host', label) !== context.distribution.host) throw new Error(`${label}.host must match distribution.json`)
  const surfaceId = stringField(document, 'surfaceId', label)
  const surface = context.compatibility.surfaces.find((candidate) => candidate.id === surfaceId)
  if (!surface) throw new Error(`${label}.surfaceId is not present in the compatibility matrix`)
  if (stringField(document, 'surface', label) !== surface.surface) throw new Error(`${label}.surface must match its matrix entry`)
  if (hasPlaceholder(stringField(document, 'hostVersion', label))) throw new Error(`${label}.hostVersion must be exact`)
  if (hasPlaceholder(stringField(document, 'model', label))) throw new Error(`${label}.model must be exact`)
  const os = objectField(document, 'os', label)
  for (const field of ['name', 'version', 'architecture']) {
    if (hasPlaceholder(stringField(os, field, `${label}.os`))) throw new Error(`${label}.os.${field} must be exact`)
  }
  const runAt = stringField(document, 'runAt', label)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(runAt) || Number.isNaN(Date.parse(runAt))) {
    throw new Error(`${label}.runAt must be an RFC 3339 timestamp`)
  }
  const repetitions = integerField(document, 'repetitions', label, 1)
  stringsField(document, 'limitations', label, 1)
  const caseIds = new Set<string>()
  const cases = arrayField(document, 'cases', label)
  if (!cases.length) throw new Error(`${label}.cases must not be empty`)
  cases.forEach((entry, index) => {
    const caseLabel = `${label}.cases[${index}]`
    const testCase = asObject(entry, caseLabel)
    const caseId = stringField(testCase, 'caseId', caseLabel)
    if (!context.caseIds.has(caseId)) throw new Error(`${caseLabel} references unknown case: ${caseId}`)
    if (caseIds.has(caseId)) throw new Error(`${label} repeats case: ${caseId}`)
    caseIds.add(caseId)
    const status = stringField(testCase, 'status', caseLabel)
    if (!resultStates.has(status)) throw new Error(`${caseLabel} has invalid status: ${status}`)
    if (integerField(testCase, 'repetitions', caseLabel, 1) !== repetitions) {
      throw new Error(`${caseLabel}.repetitions must match the result run`)
    }
    stringField(testCase, 'expected', caseLabel)
    stringField(testCase, 'observed', caseLabel)
    stringField(testCase, 'evidence', caseLabel)
  })
}

export function validateBehavior(root: string): BehaviorSummary {
  const distribution = loadDistribution(root)
  const upstream = loadUpstream(root)
  const packageJson = readJson<{ version: string }>(path.join(root, 'package.json'))
  if (packageJson.version !== upstream.distributionVersion) {
    throw new Error('package.json version must match UPSTREAM.json distributionVersion')
  }
  const activation = validateActivationInventory(
    root,
    upstream,
    readJson<unknown>(path.join(root, 'tests', 'activation', 'cases.json')),
  )
  const workflows = validateWorkflowInventory(
    root,
    distribution,
    upstream,
    readJson<unknown>(path.join(root, 'tests', 'workflows', 'cases.json')),
  )
  const allCases = [...activation.cases, ...workflows.cases]
  requireUnique(allCases, 'Stage 3 activation and workflow inventories')
  const compatibility = validateCompatibilityMatrix(
    root,
    distribution,
    upstream,
    readJson<unknown>(path.join(root, 'tests', 'compatibility', 'matrix.json')),
  )
  const resultFiles = listFiles(path.join(root, 'tests', 'results')).filter((file) => file.endsWith('.result.json'))
  const context: ResultContext = {
    distribution,
    upstream,
    compatibility,
    caseIds: new Set(allCases.map((testCase) => testCase.id)),
  }
  for (const resultFile of resultFiles) {
    validateResultDocument(root, context, readJson<unknown>(relativeFile(root, `tests/results/${resultFile}`)), `tests/results/${resultFile}`)
  }
  return {
    activation: activation.cases.length,
    positive: activation.positive,
    negative: activation.negative,
    overlap: activation.overlap,
    workflows: workflows.cases.length,
    entryPoints: workflows.entryPoints,
    comparisons: workflows.comparisons,
    safety: workflows.safety,
    compatibilitySurfaces: compatibility.surfaces.length,
    resultFiles: resultFiles.length,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = validateBehavior(process.cwd())
    console.log(
      `Behavior inventory valid: ${result.activation} activation cases (${result.positive} positive, ${result.negative} negative, ${result.overlap} overlap); ` +
      `${result.workflows} workflow cases (${result.entryPoints} entry points, ${result.comparisons} comparisons, ${result.safety} safety); ` +
      `${result.compatibilitySurfaces} compatibility surfaces; ${result.resultFiles} live result files.`,
    )
    console.log('Structural validation only: no host, model, ADK workflow, deployment, or external mutation was executed.')
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
