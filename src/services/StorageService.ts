/**
 * StorageService — Dexie（IndexedDB）本地持久化唯一入口
 *
 * W1 Story: 建立 Work Unit 最小 IndexedDB schema，提供 CRUD 方法。
 *
 * 架构约定：
 * - Service 是唯一触碰 Dexie 的层
 * - 组件层通过 Hook 消费，不直接调用 Service
 * - 写入在 Dexie 事务内完成
 */

import Dexie, { type EntityTable } from 'dexie';
import type { SourceType, ISO8601 } from '../types/workUnit.types';

// ---------------------------------------------------------------------------
// Work Unit 持久化记录（IndexedDB 表结构）
// ---------------------------------------------------------------------------

/** IndexedDB 中 Work Unit 的最小存储结构 */
export interface WorkUnitRecord {
  /** 稳定的逻辑主键（UUID） */
  id: string;
  /** 用户可见名称 */
  name: string;
  /** 来源类型 */
  sourceType: SourceType;
  /** 创建时间（ISO 8601） */
  createdAt: ISO8601;
  /** 最后修改时间（ISO 8601） */
  updatedAt: ISO8601;
}

// ---------------------------------------------------------------------------
// Dexie 数据库定义
// ---------------------------------------------------------------------------

class QomoDatabase extends Dexie {
  workUnits!: EntityTable<WorkUnitRecord, 'id'>;

  constructor() {
    super('qomo');
    this.version(1).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    });
  }
}

/** 单例数据库实例 */
const db = new QomoDatabase();

// ---------------------------------------------------------------------------
// 排序选项
// ---------------------------------------------------------------------------

export type SortField = 'updatedAt' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ListOptions {
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

// ---------------------------------------------------------------------------
// CRUD 方法
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
  return `${ts}-${rand}`;
}

function nowISO(): ISO8601 {
  return new Date().toISOString();
}

/** 获取所有 Work Unit（支持排序） */
async function listWorkUnits(options?: ListOptions): Promise<WorkUnitRecord[]> {
  const sortBy = options?.sortBy ?? 'updatedAt';
  const sortDirection = options?.sortDirection ?? 'desc';

  const records = await db.workUnits.orderBy(sortBy).toArray();
  if (sortDirection === 'desc') {
    records.reverse();
  }
  return records;
}

/** 按 ID 获取单个 Work Unit */
async function getWorkUnit(id: string): Promise<WorkUnitRecord | undefined> {
  return db.workUnits.get(id);
}

/** 创建新 Work Unit */
async function createWorkUnit(
  name: string,
  sourceType: SourceType = 'created_new',
): Promise<WorkUnitRecord> {
  const now = nowISO();
  const record: WorkUnitRecord = {
    id: generateId(),
    name,
    sourceType,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', db.workUnits, async () => {
    await db.workUnits.add(record);
  });

  return record;
}

/** 删除 Work Unit */
async function deleteWorkUnit(id: string): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    await db.workUnits.delete(id);
  });
}

/** 更新 Work Unit 名称 */
async function updateWorkUnit(
  id: string,
  updates: Partial<Pick<WorkUnitRecord, 'name'>>,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    await db.workUnits.update(id, {
      ...updates,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// 导出
// ---------------------------------------------------------------------------

export const StorageService = {
  listWorkUnits,
  getWorkUnit,
  createWorkUnit,
  deleteWorkUnit,
  updateWorkUnit,
  /** 暴露 db 实例用于测试 reset */
  _db: db,
};
