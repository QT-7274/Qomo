/**
 * CapabilityAvailability 类型定义
 *
 * V3a Story: capability 可用性总览。
 *
 * 复用 B0-2 的 CapabilityIssue.issueType 枚举，
 * 扩展一个 'ready' 状态。
 */

import type { CapabilityIssue } from './decision.types';

// ---------------------------------------------------------------------------
// 可用性状态
// ---------------------------------------------------------------------------

/**
 * 能力可用性状态。
 * 'ready' 为 V3a 新增；其余四值复用 B0-2 CapabilityIssue.issueType。
 */
export type AvailabilityStatus =
  | 'ready'
  | CapabilityIssue['issueType'];

// ---------------------------------------------------------------------------
// 可用性条目
// ---------------------------------------------------------------------------

/** 单个 Capability 的可用性判断结果 */
export interface CapabilityAvailabilityItem {
  /** 能力 ID */
  readonly capabilityId: string;
  /** 能力名称 */
  readonly capabilityName: string;
  /** 所属 Slot ID */
  readonly slotId: string;
  /** 所属 Slot 名称 */
  readonly slotName: string;
  /** 可用性状态 */
  status: AvailabilityStatus;
  /** 问题类型（status 非 ready 时有值） */
  issueType?: CapabilityIssue['issueType'];
  /** 问题描述 */
  description?: string;
}

// ---------------------------------------------------------------------------
// 可用性汇总
// ---------------------------------------------------------------------------

/** 能力可用性汇总统计 */
export interface AvailabilitySummary {
  /** ready 数量 */
  readonly readyCount: number;
  /** blocked 数量（missing + version_incompatible + permission_denied） */
  readonly blockedCount: number;
  /** ambiguous 数量（ambiguous_candidate） */
  readonly ambiguousCount: number;
  /** 完整条目列表 */
  readonly items: readonly CapabilityAvailabilityItem[];
}
