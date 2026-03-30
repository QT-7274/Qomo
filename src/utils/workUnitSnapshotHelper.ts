/**
 * WorkUnitSnapshot 语义辅助函数
 *
 * B0.1 任务 2：创建、归一化、格式化 identity / version / lineage 引用。
 *
 * 本文件只处理前端域语义，不引入 backend / persistence / API 假设。
 * 支持三类谱系表达：复制、历史恢复、全新创建。
 */

import type {
  WorkUnitIdentity,
  SnapshotIdentity,
  LineageReference,
  WorkUnitSnapshot,
  BuildSnapshotParams,
  ISO8601,
} from '../types/workUnit.types';

// ---------------------------------------------------------------------------
// ID 生成
// ---------------------------------------------------------------------------

/**
 * 生成唯一 ID。
 * 优先使用 crypto.randomUUID()（所有现代浏览器支持），
 * 降级为 timestamp + random 组合。
 */
function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // 降级方案
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${prefix}_${ts}_${rand}`;
}

/** 获取当前 ISO 8601 时间戳 */
function nowISO(): ISO8601 {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

/**
 * 格式化 snapshotId：`{workUnitId}#v{versionNumber}`
 */
export function formatSnapshotId(workUnitId: string, versionNumber: string): string {
  return `${workUnitId}#v${versionNumber}`;
}

// ---------------------------------------------------------------------------
// 逻辑身份创建
// ---------------------------------------------------------------------------

/**
 * 创建新的 WorkUnitIdentity。
 * workUnitId 自动生成，跨所有版本不变。
 */
export function createWorkUnitIdentity(
  name: string,
  description?: string,
): WorkUnitIdentity {
  return {
    workUnitId: generateId('wu'),
    name,
    description,
    createdAt: nowISO(),
  };
}

// ---------------------------------------------------------------------------
// 快照/版本身份创建
// ---------------------------------------------------------------------------

/**
 * 创建 SnapshotIdentity。
 *
 * @param workUnitId - 所属 Work Unit 的逻辑 ID
 * @param versionNumber - 语义化版本号，例如 "1.0.0"
 * @param contentHash - 序列化内容的哈希
 * @param previousVersionId - 前一版本 ID（首个版本传 null 或省略）
 */
export function createSnapshotIdentity(
  workUnitId: string,
  versionNumber: string,
  contentHash: string,
  previousVersionId: string | null = null,
): SnapshotIdentity {
  return {
    snapshotId: formatSnapshotId(workUnitId, versionNumber),
    versionId: generateId('ver'),
    versionNumber,
    createdAt: nowISO(),
    contentHash,
    previousVersionId,
  };
}

// ---------------------------------------------------------------------------
// 谱系引用创建
// ---------------------------------------------------------------------------

/**
 * 创建全新对象的谱系（无来源）。
 */
export function createFreshLineage(): LineageReference {
  return {
    sourceType: 'created_new',
    sourceWorkUnitId: null,
    lineagePath: [],
  };
}

/**
 * 创建克隆谱系：从另一个 Work Unit 复制。
 *
 * @param sourceWorkUnitId - 被克隆的 Work Unit ID
 * @param sourceVersionNumber - 被克隆时的版本号
 * @param newWorkUnitId - 新创建的克隆体 Work Unit ID
 */
export function createCloneLineage(
  sourceWorkUnitId: string,
  sourceVersionNumber: string,
  newWorkUnitId: string,
): LineageReference {
  return {
    sourceType: 'cloned_from',
    sourceWorkUnitId,
    lineagePath: [
      {
        workUnitId: newWorkUnitId,
        versionNumber: sourceVersionNumber,
        action: 'cloned',
        timestamp: nowISO(),
      },
    ],
  };
}

/**
 * 创建历史版本恢复谱系。
 *
 * @param sourceWorkUnitId - 原始 Work Unit ID
 * @param restoredVersionNumber - 被恢复的版本号
 * @param newWorkUnitId - 恢复后新创建的 Work Unit ID
 */
export function createRestoredLineage(
  sourceWorkUnitId: string,
  restoredVersionNumber: string,
  newWorkUnitId: string,
): LineageReference {
  return {
    sourceType: 'restored_from',
    sourceWorkUnitId,
    lineagePath: [
      {
        workUnitId: newWorkUnitId,
        versionNumber: restoredVersionNumber,
        action: 'restored',
        timestamp: nowISO(),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 组合构建器
// ---------------------------------------------------------------------------

/**
 * 一步构建完整的全新 WorkUnitSnapshot。
 * 自动创建 identity、初始版本 snapshot 和 fresh lineage。
 */
export function buildWorkUnitSnapshot(
  params: BuildSnapshotParams,
): WorkUnitSnapshot {
  const identity = createWorkUnitIdentity(params.name, params.description);
  const version = params.initialVersion ?? '1.0.0';
  const snapshot = createSnapshotIdentity(
    identity.workUnitId,
    version,
    params.contentHash,
  );
  const lineage = createFreshLineage();

  return { identity, snapshot, lineage };
}
