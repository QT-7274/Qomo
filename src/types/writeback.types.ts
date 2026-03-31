/**
 * 最小回写摘要（MinimalWritebackSummary）及相关类型
 *
 * B0.2 Story: 统一 decision / 最小回写 / observation 的分层词汇表。
 *
 * 本文件只定义前端共享 contract，不涉及：
 * - backend schema / OpenAPI / endpoint / DB / infra
 * - 完整观测数据平台 / 报表
 *
 * === 分层约束 ===
 * WritebackOutcome 独立于 DecisionResultType。
 * 回写失败必须保留为独立 outcome，不得伪装成决策成功。
 * "未写回" 不得伪装成 "已观测"。
 *
 * 后续 O1、O2、O3 必须复用本文件类型，不得各自重复定义。
 */

import type { ISO8601 } from './workUnit.types';
import type { DecisionResultType } from './decision.types';

// ---------------------------------------------------------------------------
// 回写结果状态 — 独立于 decision
// ---------------------------------------------------------------------------

/**
 * 回写操作的结果状态。
 * 与 DecisionResultType 完全独立，不可混用。
 */
export type WritebackOutcome = 'success' | 'partial' | 'failure' | 'skipped';

// ---------------------------------------------------------------------------
// 交付结果
// ---------------------------------------------------------------------------

/** 交付动作的结果类型 */
export type HandoffResultType = 'copied' | 'downloaded' | 'select_all_fallback';

/** 交付动作的结果状态 */
export type HandoffOutcome = 'success' | 'failure';

/** 交付结果记录 */
export interface HandoffResult {
  /** 交付方式 */
  readonly resultType: HandoffResultType;
  /** 交付结果 */
  readonly outcome: HandoffOutcome;
  /** 失败原因（仅 failure 时有值） */
  readonly failureReason?: string;
  /** 交付时间 */
  readonly completedAt: ISO8601;
}

// ---------------------------------------------------------------------------
// 关键问题摘要
// ---------------------------------------------------------------------------

/** 启动过程中遇到的关键问题 */
export interface KeyIssueSummary {
  /** 问题类型 */
  readonly issueType: 'capability_missing' | 'capability_degraded' | 'context_incomplete' | 'user_override';
  /** 问题描述 */
  readonly description: string;
  /** 严重程度 */
  readonly severity: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// 最小回写摘要
// ---------------------------------------------------------------------------

/**
 * MinimalWritebackSummary: 每次启动完成后的最小回写记录。
 *
 * 必须包含：版本引用、decision 摘要、关键问题摘要、交付结果。
 * 这是 O1 (启动最小回写摘要) 的核心数据结构。
 *
 * 约束：
 * - writebackOutcome 独立于 decisionResult，不可混用
 * - 回写失败时必须留下失败记录，不得静默丢弃
 */
export interface MinimalWritebackSummary {
  /** 回写记录 ID */
  readonly writebackId: string;
  /** 关联的决策 ID */
  readonly decisionId: string;
  /** 所属 WorkUnit 的逻辑 ID */
  readonly workUnitId: string;
  /** 使用的快照版本 ID（复用 B0.1 SnapshotIdentity 引用） */
  readonly snapshotVersionId: string;

  /** 决策结果摘要（引用，不重复存储完整 LaunchDecision） */
  readonly decisionResult: DecisionResultType;

  /** 关键问题摘要列表 */
  readonly keyIssues: readonly KeyIssueSummary[];

  /** 交付结果（cancel 决策时为 null） */
  readonly handoffResult: HandoffResult | null;

  /** 回写本身的结果 — 独立于 decision outcome */
  readonly writebackOutcome: WritebackOutcome;
  /** 回写失败原因（仅 failure/partial 时有值） */
  readonly writebackFailureReason?: string;

  /** 回写创建时间 */
  readonly createdAt: ISO8601;
}
