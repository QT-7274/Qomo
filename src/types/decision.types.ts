/**
 * LaunchDecision 及相关决策词汇
 *
 * B0.2 Story: 统一 decision / 最小回写 / observation 的分层词汇表。
 *
 * 本文件只定义前端共享 contract，不涉及：
 * - backend schema / OpenAPI / endpoint / DB / infra
 * - runtime capability discovery 具体实现
 * - 完整观测数据平台 / 报表
 *
 * === 分层约束 ===
 * LaunchDecision.resultType 只允许四值：continue / cancel / degrade / substitute
 * 所有用户后续动作（手动补充、返回修订、retry）和系统事件
 * （handoff_failure、writeback_failure、observation_failure）
 * 必须在 action / outcome 层独立表达，不得混入 resultType。
 *
 * 后续 V3a/b/c、V4、V5、O1-O4 必须复用本文件类型，不得各自重复定义。
 */

import type { ISO8601 } from './workUnit.types';

// ---------------------------------------------------------------------------
// 决策结果类型 — 只允许四值
// ---------------------------------------------------------------------------

/**
 * 启动决策的结果类型。
 *
 * 硬约束：只允许这四个值。
 * 所有后续动作（手动补充、返回修订、retry）和系统失败事件
 * 必须使用 ActionType 或 OutcomeStatus 表达。
 */
export type DecisionResultType = 'continue' | 'cancel' | 'degrade' | 'substitute';

// ---------------------------------------------------------------------------
// 决策上下文
// ---------------------------------------------------------------------------

/** 能力可用性的简要摘要（用于决策上下文） */
export interface CapabilityIssue {
  /** 能力名称 */
  readonly capabilityName: string;
  /** 问题类型 */
  readonly issueType: 'missing' | 'version_incompatible' | 'permission_denied' | 'ambiguous_candidate';
  /** 可选的问题描述 */
  readonly description?: string;
}

/** 降级或替代选项 */
export interface FallbackOption {
  /** 选项类型 */
  readonly optionType: 'degrade' | 'substitute';
  /** 选项描述 */
  readonly description: string;
  /** 涉及的能力名称 */
  readonly capabilityName?: string;
}

/**
 * 决策时的上下文信息。
 * 承载做出 LaunchDecision 所需的输入。
 */
export interface DecisionContext {
  /** 能力可用性问题列表（空数组表示无问题） */
  readonly issues: readonly CapabilityIssue[];
  /** 可用的降级/替代选项 */
  readonly fallbackOptions: readonly FallbackOption[];
  /** 决策时间 */
  readonly decidedAt: ISO8601;
}

// ---------------------------------------------------------------------------
// LaunchDecision — 启动决策
// ---------------------------------------------------------------------------

/**
 * LaunchDecision: 启动决策结果。
 *
 * 只记录"用户做出了什么决策"，不记录后续交付/回写/观测结果。
 * 后续结果由各自的 outcome 类型独立承载。
 */
export interface LaunchDecision {
  /** 决策 ID */
  readonly decisionId: string;
  /** 所属 WorkUnit 的逻辑 ID */
  readonly workUnitId: string;
  /** 决策使用的快照版本 ID */
  readonly snapshotVersionId: string;
  /** 决策结果 — 只允许四值 */
  readonly resultType: DecisionResultType;
  /** 用户选择的降级/替代选项（仅 degrade/substitute 时有值） */
  readonly selectedFallback?: FallbackOption;
  /** 决策上下文 */
  readonly context: DecisionContext;
}

// ---------------------------------------------------------------------------
// DecisionOutcome — 决策后的实际结果（独立于 resultType）
// ---------------------------------------------------------------------------

/**
 * DecisionOutcome: 承载决策后的实际结果。
 *
 * 与 LaunchDecision.resultType（用户做了什么决策）严格分离。
 * resultType 记录"决策是什么"，DecisionOutcome 记录"决策之后实际发生了什么"。
 *
 * 手动补充、返回修订、retry 等用户后续动作属于此层，
 * 不得混入 LaunchDecision.resultType。
 */
export interface DecisionOutcome {
  /** 关联的决策 ID */
  readonly decisionId: string;
  /** 决策后用户实际采取的动作 */
  readonly followUpAction: FollowUpAction;
  /** 动作描述 */
  readonly description?: string;
  /** 动作时间 */
  readonly occurredAt: ISO8601;
}

/**
 * 用户在决策之后可能采取的后续动作。
 *
 * 这些值不得出现在 LaunchDecision.resultType 中 —— 它们属于 outcome 层。
 */
export type FollowUpAction =
  | 'proceed'           // 按决策继续执行
  | 'manual_supplement' // 手动补充（手动补充缺失能力/上下文）
  | 'return_to_revise'  // 返回 Web 修订
  | 'retry'             // 重试启动
  | 'abort';            // 中止（放弃本次启动）
