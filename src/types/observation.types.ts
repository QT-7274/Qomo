/**
 * 观测事件分层词汇表
 *
 * B0.2 Story: 统一 decision / 最小回写 / observation 的分层词汇表。
 *
 * 本文件只定义前端共享 contract，不涉及：
 * - backend schema / OpenAPI / endpoint / DB / infra
 * - 完整观测数据平台 / 报表 / 统计
 *
 * === 四层事件分离 ===
 * 1. decision_event — 决策本身的结果
 * 2. handoff_event — 交付动作的结果
 * 3. writeback_event — 回写动作的结果
 * 4. observation_event — 观测/验证动作的结果
 *
 * 每层有独立的 outcome，不得跨层混写。
 * handoff_failure、writeback_failure、observation_failure 作为独立 outcome 存在。
 *
 * 后续 O1-O4 必须复用本文件类型，不得各自重复定义。
 */

import type { ISO8601 } from './workUnit.types';
import type { DecisionResultType } from './decision.types';
import type { WritebackOutcome, HandoffOutcome } from './writeback.types';

// ---------------------------------------------------------------------------
// 事件层级类型
// ---------------------------------------------------------------------------

/** 观测事件的四个层级 */
export type EventLayer = 'decision_event' | 'handoff_event' | 'writeback_event' | 'observation_event';

// ---------------------------------------------------------------------------
// 观测层 outcome — 独立于 decision / handoff / writeback
// ---------------------------------------------------------------------------

/** 观测动作本身的结果状态 */
export type ObservationOutcome = 'recorded' | 'partial' | 'failure' | 'not_applicable';

// ---------------------------------------------------------------------------
// 基础事件结构
// ---------------------------------------------------------------------------

/** 所有观测事件共享的基础字段 */
export interface BaseObservationEvent {
  /** 事件 ID */
  readonly eventId: string;
  /** 事件所属层级 */
  readonly layer: EventLayer;
  /** 所属 WorkUnit 的逻辑 ID */
  readonly workUnitId: string;
  /** 关联的决策 ID */
  readonly decisionId: string;
  /** 事件发生时间 */
  readonly timestamp: ISO8601;
}

// ---------------------------------------------------------------------------
// 各层级事件类型
// ---------------------------------------------------------------------------

/** 决策层事件 */
export interface DecisionEvent extends BaseObservationEvent {
  readonly layer: 'decision_event';
  /** 决策结果 */
  readonly decisionResult: DecisionResultType;
  /** 是否有能力问题 */
  readonly hasCapabilityIssues: boolean;
  /** 能力问题数量 */
  readonly issueCount: number;
}

/** 交付层事件 */
export interface HandoffEvent extends BaseObservationEvent {
  readonly layer: 'handoff_event';
  /** 交付结果 */
  readonly handoffOutcome: HandoffOutcome;
  /** 交付方式 */
  readonly handoffMethod?: 'copied' | 'downloaded' | 'select_all_fallback';
  /** 失败原因（仅 failure 时有值） */
  readonly failureReason?: string;
}

/** 回写层事件 */
export interface WritebackEvent extends BaseObservationEvent {
  readonly layer: 'writeback_event';
  /** 回写结果 */
  readonly writebackOutcome: WritebackOutcome;
  /** 失败原因（仅 failure/partial 时有值） */
  readonly failureReason?: string;
}

/** 观测层事件 */
export interface ObservationEvent extends BaseObservationEvent {
  readonly layer: 'observation_event';
  /** 观测结果 */
  readonly observationOutcome: ObservationOutcome;
  /** 观测类型 */
  readonly observationType: 'reuse_signal' | 'delivery_completion' | 'return_to_web' | 'general';
  /** 观测摘要 */
  readonly summary?: string;
}

// ---------------------------------------------------------------------------
// 联合类型
// ---------------------------------------------------------------------------

/** 任何层级的观测事件 */
export type AnyObservationEvent = DecisionEvent | HandoffEvent | WritebackEvent | ObservationEvent;
