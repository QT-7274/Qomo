/**
 * Launch（启动台）相关类型定义
 *
 * V1 Story: 启动入口与对象选择。
 */

import type { ISO8601 } from './workUnit.types';

/** 启动会话状态 */
export type LaunchSessionStatus = 'active' | 'completed' | 'cancelled';

/** 启动会话 — 用户选择 Work Unit 后进入的启动上下文 */
export interface LaunchSession {
  /** 启动会话 ID */
  readonly sessionId: string;
  /** 选中的 Work Unit ID */
  readonly workUnitId: string;
  /** 使用的快照 ID（无快照时为 undefined，使用当前编辑版本） */
  readonly snapshotId?: string;
  /** 选择时间 */
  readonly selectedAt: ISO8601;
  /** 会话状态 */
  status: LaunchSessionStatus;
}

/** 最近使用记录 — 持久化到 IndexedDB */
export interface RecentLaunchRecord {
  /** 记录 ID（= workUnitId，每个 WU 只保留一条） */
  readonly id: string;
  /** Work Unit ID */
  readonly workUnitId: string;
  /** Work Unit 名称（冗余存储，避免 join） */
  workUnitName: string;
  /** 最后一次启动选择时间 */
  lastLaunchedAt: ISO8601;
}
