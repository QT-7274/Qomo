/**
 * Decision / Writeback / Observation 语义辅助函数
 *
 * B0.2 任务 4：创建 LaunchDecision、MinimalWritebackSummary、观测事件的 helper。
 *
 * 本文件只处理前端域语义，不引入 backend / persistence / API 假设。
 * 所有 helper 在类型层面强制执行 result / action / outcome 分离。
 */

import type { ISO8601 } from '../types/workUnit.types';
import type {
  DecisionResultType,
  CapabilityIssue,
  FallbackOption,
  LaunchDecision,
} from '../types/decision.types';
import type {
  WritebackOutcome,
  HandoffResult,
  KeyIssueSummary,
  MinimalWritebackSummary,
} from '../types/writeback.types';
import type {
  DecisionEvent,
  HandoffEvent,
  WritebackEvent,
  ObservationEvent,
  ObservationOutcome,
} from '../types/observation.types';

// ---------------------------------------------------------------------------
// ID 生成（复用 B0.1 模式）
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${prefix}_${ts}_${rand}`;
}

function nowISO(): ISO8601 {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// LaunchDecision 创建
// ---------------------------------------------------------------------------

export interface CreateDecisionParams {
  workUnitId: string;
  snapshotVersionId: string;
  resultType: DecisionResultType;
  issues?: readonly CapabilityIssue[];
  fallbackOptions?: readonly FallbackOption[];
  selectedFallback?: FallbackOption;
}

/**
 * 创建 LaunchDecision。
 * resultType 在类型层面被约束为四值。
 * selectedFallback 仅在 degrade/substitute 时有效，其他情况自动忽略。
 */
export function createLaunchDecision(params: CreateDecisionParams): LaunchDecision {
  const now = nowISO();
  const needsFallback = params.resultType === 'degrade' || params.resultType === 'substitute';
  return {
    decisionId: generateId('dec'),
    workUnitId: params.workUnitId,
    snapshotVersionId: params.snapshotVersionId,
    resultType: params.resultType,
    selectedFallback: needsFallback ? params.selectedFallback : undefined,
    context: {
      issues: params.issues ?? [],
      fallbackOptions: params.fallbackOptions ?? [],
      decidedAt: now,
    },
  };
}

// ---------------------------------------------------------------------------
// MinimalWritebackSummary 创建
// ---------------------------------------------------------------------------

export interface CreateWritebackParams {
  decisionId: string;
  workUnitId: string;
  snapshotVersionId: string;
  decisionResult: DecisionResultType;
  keyIssues?: readonly KeyIssueSummary[];
  handoffResult?: HandoffResult | null;
  writebackOutcome: WritebackOutcome;
  writebackFailureReason?: string;
}

/**
 * 创建 MinimalWritebackSummary。
 * writebackOutcome 独立于 decisionResult，在类型层面不可混用。
 */
export function createWritebackSummary(params: CreateWritebackParams): MinimalWritebackSummary {
  return {
    writebackId: generateId('wb'),
    decisionId: params.decisionId,
    workUnitId: params.workUnitId,
    snapshotVersionId: params.snapshotVersionId,
    decisionResult: params.decisionResult,
    keyIssues: params.keyIssues ?? [],
    handoffResult: params.handoffResult ?? null,
    writebackOutcome: params.writebackOutcome,
    writebackFailureReason: params.writebackFailureReason,
    createdAt: nowISO(),
  };
}

/**
 * 创建表示回写失败的 MinimalWritebackSummary。
 * 便捷方法：确保回写失败被正确记录为独立 outcome。
 */
export interface CreateFailedWritebackParams {
  decisionId: string;
  workUnitId: string;
  snapshotVersionId: string;
  decisionResult: DecisionResultType;
  failureReason: string;
}

export function createFailedWriteback(
  params: CreateFailedWritebackParams,
): MinimalWritebackSummary {
  return createWritebackSummary({
    decisionId: params.decisionId,
    workUnitId: params.workUnitId,
    snapshotVersionId: params.snapshotVersionId,
    decisionResult: params.decisionResult,
    writebackOutcome: 'failure',
    writebackFailureReason: params.failureReason,
  });
}

// ---------------------------------------------------------------------------
// 观测事件创建
// ---------------------------------------------------------------------------

/**
 * 创建决策层观测事件。
 */
export function createDecisionEvent(
  decision: LaunchDecision,
): DecisionEvent {
  return {
    eventId: generateId('evt'),
    layer: 'decision_event',
    workUnitId: decision.workUnitId,
    decisionId: decision.decisionId,
    timestamp: nowISO(),
    decisionResult: decision.resultType,
    hasCapabilityIssues: decision.context.issues.length > 0,
    issueCount: decision.context.issues.length,
  };
}

/**
 * 创建交付层观测事件。
 */
export function createHandoffEvent(
  decisionId: string,
  workUnitId: string,
  handoffResult: HandoffResult,
): HandoffEvent {
  return {
    eventId: generateId('evt'),
    layer: 'handoff_event',
    workUnitId,
    decisionId,
    timestamp: nowISO(),
    handoffOutcome: handoffResult.outcome,
    handoffMethod: handoffResult.resultType,
    failureReason: handoffResult.outcome === 'failure' ? handoffResult.failureReason : undefined,
  };
}

/**
 * 创建回写层观测事件。
 */
export function createWritebackEvent(
  writeback: MinimalWritebackSummary,
): WritebackEvent {
  return {
    eventId: generateId('evt'),
    layer: 'writeback_event',
    workUnitId: writeback.workUnitId,
    decisionId: writeback.decisionId,
    timestamp: nowISO(),
    writebackOutcome: writeback.writebackOutcome,
    failureReason: writeback.writebackOutcome === 'failure' || writeback.writebackOutcome === 'partial'
      ? writeback.writebackFailureReason
      : undefined,
  };
}

/**
 * 创建观测层事件。
 */
export function createObservationEvent(
  decisionId: string,
  workUnitId: string,
  observationType: ObservationEvent['observationType'],
  observationOutcome: ObservationOutcome,
  summary?: string,
): ObservationEvent {
  return {
    eventId: generateId('evt'),
    layer: 'observation_event',
    workUnitId,
    decisionId,
    timestamp: nowISO(),
    observationOutcome,
    observationType,
    summary,
  };
}
