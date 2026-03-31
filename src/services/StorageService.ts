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
import type { Slot } from '../types/slot.types';
import type { Capability } from '../types/capability.types';
import type { ConstraintPack } from '../types/constraint.types';
import type { FillInDeclaration } from '../types/fillIn.types';

// ---------------------------------------------------------------------------
// Work Unit 持久化记录（IndexedDB 表结构）
// ---------------------------------------------------------------------------

/** 版本快照记录 */
export interface WorkUnitVersionRecord {
  id: string;
  workUnitId: string;
  versionNumber: number;
  contentHash: string;
  content: string;
  createdAt: ISO8601;
}

/** IndexedDB 中 Work Unit 的存储结构 */
export interface WorkUnitRecord {
  /** 稳定的逻辑主键（UUID） */
  id: string;
  /** 用户可见名称 */
  name: string;
  /** 描述信息 */
  description: string;
  /** 来源类型 */
  sourceType: SourceType;
  /** 结构化 Slot 列表（嵌套 JSON） */
  slots: Slot[];
  /** 约束包列表（嵌套 JSON） */
  constraints: ConstraintPack[];
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
  workUnitVersions!: EntityTable<WorkUnitVersionRecord, 'id'>;

  constructor() {
    super('qomo');
    this.version(1).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    });
    this.version(2).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    }).upgrade((tx) => {
      return tx.table('workUnits').toCollection().modify((wu) => {
        if ((wu as Record<string, unknown>).description === undefined) {
          (wu as Record<string, unknown>).description = '';
        }
        if ((wu as Record<string, unknown>).slots === undefined) {
          (wu as Record<string, unknown>).slots = [];
        }
      });
    });
    this.version(3).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    }).upgrade((tx) => {
      return tx.table('workUnits').toCollection().modify((wu) => {
        if ((wu as Record<string, unknown>).constraints === undefined) {
          (wu as Record<string, unknown>).constraints = [];
        }
      });
    });
    this.version(4).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    });
    // No data migration needed: fillIn is an optional field inside nested Slot JSON.
    // Existing Slots naturally have fillIn === undefined.
    this.version(5).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
      workUnitVersions: 'id, workUnitId, createdAt',
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

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
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
    description: '',
    sourceType,
    slots: [],
    constraints: [],
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

/** 更新 Work Unit 基本信息（名称、描述） */
async function updateWorkUnitInfo(
  id: string,
  updates: Partial<Pick<WorkUnitRecord, 'name' | 'description'>>,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    await db.workUnits.update(id, {
      ...updates,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// Slot CRUD
// ---------------------------------------------------------------------------

/** addSlot 的参数 */
interface AddSlotParams {
  name: string;
  slotType: import('../types/slot.types').SlotType;
  description?: string;
  required: boolean;
}

/** 为 Work Unit 添加一个 Slot */
async function addSlot(workUnitId: string, params: AddSlotParams): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const newSlot: Slot = {
      id: generateId(),
      name: params.name,
      slotType: params.slotType,
      description: params.description,
      required: params.required,
      capabilities: [],
    };

    wu.slots.push(newSlot);
    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** updateSlot 的参数 */
interface UpdateSlotParams {
  name?: string;
  slotType?: import('../types/slot.types').SlotType;
  description?: string;
  required?: boolean;
}

/** 更新 Slot 属性 */
async function updateSlot(
  workUnitId: string,
  slotId: string,
  params: UpdateSlotParams,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    if (params.name !== undefined) slot.name = params.name;
    if (params.slotType !== undefined) slot.slotType = params.slotType;
    if (params.description !== undefined) slot.description = params.description;
    if (params.required !== undefined) slot.required = params.required;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** 删除 Slot（仅当无 Capability 时允许） */
async function deleteSlot(workUnitId: string, slotId: string): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slotIndex = wu.slots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) throw new Error(`Slot ${slotId} 不存在`);

    if (wu.slots[slotIndex].capabilities.length > 0) {
      throw new Error('Slot 下仍有 Capability，无法删除');
    }

    wu.slots.splice(slotIndex, 1);
    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// Capability CRUD
// ---------------------------------------------------------------------------

/** addCapability 的参数 */
interface AddCapabilityParams {
  name: string;
  content: string;
}

/** 为 Slot 添加 Capability */
async function addCapability(
  workUnitId: string,
  slotId: string,
  params: AddCapabilityParams,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    const maxOrder = slot.capabilities.length > 0
      ? Math.max(...slot.capabilities.map((c) => c.order))
      : -1;

    const newCap: Capability = {
      id: generateId(),
      name: params.name,
      content: params.content,
      order: maxOrder + 1,
    };

    slot.capabilities.push(newCap);
    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** updateCapability 的参数 */
interface UpdateCapabilityParams {
  name?: string;
  content?: string;
}

/** 更新 Capability 属性 */
async function updateCapability(
  workUnitId: string,
  slotId: string,
  capabilityId: string,
  params: UpdateCapabilityParams,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    const cap = slot.capabilities.find((c) => c.id === capabilityId);
    if (!cap) throw new Error(`Capability ${capabilityId} 不存在`);

    if (params.name !== undefined) cap.name = params.name;
    if (params.content !== undefined) cap.content = params.content;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** 删除 Capability */
async function deleteCapability(
  workUnitId: string,
  slotId: string,
  capabilityId: string,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    slot.capabilities = slot.capabilities.filter((c) => c.id !== capabilityId);

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** 按新的 ID 顺序重排 Capability */
async function reorderCapabilities(
  workUnitId: string,
  slotId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    const capMap = new Map(slot.capabilities.map((c) => [c.id, c]));
    slot.capabilities = orderedIds.map((id, index) => {
      const cap = capMap.get(id);
      if (!cap) throw new Error(`Capability ${id} 不存在`);
      cap.order = index;
      return cap;
    });

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// Slot FillIn CRUD
// ---------------------------------------------------------------------------

/** 为 Slot 设置待补齐声明 */
async function setSlotFillIn(
  workUnitId: string,
  slotId: string,
  fillIn: FillInDeclaration,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    slot.fillIn = fillIn;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** 清除 Slot 的待补齐声明 */
async function clearSlotFillIn(
  workUnitId: string,
  slotId: string,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    delete slot.fillIn;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// Constraint CRUD
// ---------------------------------------------------------------------------

/** addConstraint 的参数 */
interface AddConstraintParams {
  name: string;
  constraintType: import('../types/constraint.types').ConstraintType;
  content: string;
  outputFormat?: import('../types/constraint.types').OutputFormatType;
  lengthLimit?: import('../types/constraint.types').LengthLimit;
  checklistItems?: Array<{ text: string; required: boolean }>;
}

/** 为 Work Unit 添加约束包 */
async function addConstraint(workUnitId: string, params: AddConstraintParams): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const maxOrder = wu.constraints.length > 0
      ? Math.max(...wu.constraints.map((c) => c.order))
      : -1;

    const newConstraint: ConstraintPack = {
      id: generateId(),
      name: params.name,
      constraintType: params.constraintType,
      content: params.content,
      order: maxOrder + 1,
      outputFormat: params.outputFormat,
      lengthLimit: params.lengthLimit,
      checklistItems: params.checklistItems?.map((item, index) => ({
        id: generateId(),
        text: item.text,
        required: item.required,
        order: index,
      })),
    };

    wu.constraints.push(newConstraint);
    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

/** updateConstraint 的参数 */
interface UpdateConstraintParams {
  name?: string;
  content?: string;
  outputFormat?: import('../types/constraint.types').OutputFormatType;
  lengthLimit?: import('../types/constraint.types').LengthLimit;
}

/** 更新约束包属性 */
async function updateConstraint(
  workUnitId: string,
  constraintId: string,
  params: UpdateConstraintParams,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const constraint = wu.constraints.find((c) => c.id === constraintId);
    if (!constraint) throw new Error(`Constraint ${constraintId} 不存在`);

    if (params.name !== undefined) constraint.name = params.name;
    if (params.content !== undefined) constraint.content = params.content;
    if (params.outputFormat !== undefined) constraint.outputFormat = params.outputFormat;
    if (params.lengthLimit !== undefined) constraint.lengthLimit = params.lengthLimit;

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

/** 删除约束包 */
async function deleteConstraint(workUnitId: string, constraintId: string): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    wu.constraints = wu.constraints.filter((c) => c.id !== constraintId);

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

/** 按新的 ID 顺序重排约束包 */
async function reorderConstraints(workUnitId: string, orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const constraintMap = new Map(wu.constraints.map((c) => [c.id, c]));
    wu.constraints = orderedIds.map((id, index) => {
      const constraint = constraintMap.get(id);
      if (!constraint) throw new Error(`Constraint ${id} 不存在`);
      constraint.order = index;
      return constraint;
    });

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// ChecklistItem CRUD (inside quality ConstraintPacks)
// ---------------------------------------------------------------------------

async function addChecklistItem(
  workUnitId: string,
  constraintId: string,
  params: { text: string; required: boolean },
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const cp = wu.constraints.find((c) => c.id === constraintId);
    if (!cp) throw new Error(`Constraint ${constraintId} 不存在`);

    if (!cp.checklistItems) cp.checklistItems = [];

    const maxOrder = cp.checklistItems.length > 0
      ? Math.max(...cp.checklistItems.map((i) => i.order))
      : -1;

    cp.checklistItems.push({
      id: generateId(),
      text: params.text,
      required: params.required,
      order: maxOrder + 1,
    });

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

async function updateChecklistItem(
  workUnitId: string,
  constraintId: string,
  itemId: string,
  params: { text?: string; required?: boolean },
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const cp = wu.constraints.find((c) => c.id === constraintId);
    if (!cp) throw new Error(`Constraint ${constraintId} 不存在`);

    const item = cp.checklistItems?.find((i) => i.id === itemId);
    if (!item) throw new Error(`ChecklistItem ${itemId} 不存在`);

    if (params.text !== undefined) item.text = params.text;
    if (params.required !== undefined) item.required = params.required;

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

async function deleteChecklistItem(
  workUnitId: string,
  constraintId: string,
  itemId: string,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const cp = wu.constraints.find((c) => c.id === constraintId);
    if (!cp) throw new Error(`Constraint ${constraintId} 不存在`);

    cp.checklistItems = (cp.checklistItems ?? []).filter((i) => i.id !== itemId);

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

async function reorderChecklistItems(
  workUnitId: string,
  constraintId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const cp = wu.constraints.find((c) => c.id === constraintId);
    if (!cp) throw new Error(`Constraint ${constraintId} 不存在`);

    const itemMap = new Map((cp.checklistItems ?? []).map((i) => [i.id, i]));
    cp.checklistItems = orderedIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) throw new Error(`ChecklistItem ${id} 不存在`);
      item.order = index;
      return item;
    });

    await db.workUnits.update(workUnitId, {
      constraints: wu.constraints,
      updatedAt: nowISO(),
    });
  });
}

// ---------------------------------------------------------------------------
// Clone
// ---------------------------------------------------------------------------

/** 复制 Work Unit（深拷贝结构，新 ID，sourceType 设为 cloned_from） */
async function cloneWorkUnit(sourceId: string): Promise<WorkUnitRecord> {
  const now = nowISO();
  let cloned: WorkUnitRecord | undefined;

  await db.transaction('rw', db.workUnits, async () => {
    const source = await db.workUnits.get(sourceId);
    if (!source) throw new Error(`Work Unit ${sourceId} 不存在`);

    // 深拷贝 Slots，为每个 Slot 和 Capability 分配新 ID
    const clonedSlots: Slot[] = source.slots.map((slot) => ({
      ...slot,
      id: generateId(),
      capabilities: slot.capabilities.map((cap) => ({
        ...cap,
        id: generateId(),
      })),
    }));

    // 深拷贝 Constraints，为每个约束包和检查项分配新 ID
    const clonedConstraints: ConstraintPack[] = source.constraints.map((cp) => ({
      ...cp,
      id: generateId(),
      checklistItems: cp.checklistItems?.map((ci) => ({
        ...ci,
        id: generateId(),
      })),
    }));

    cloned = {
      id: generateId(),
      name: `${source.name}（副本）`,
      description: source.description,
      sourceType: 'cloned_from',
      slots: clonedSlots,
      constraints: clonedConstraints,
      createdAt: now,
      updatedAt: now,
    };

    await db.workUnits.add(cloned);
  });

  return cloned!;
}

// ---------------------------------------------------------------------------
// Version Snapshots
// ---------------------------------------------------------------------------

const MAX_SNAPSHOTS = 5;

async function createSnapshot(workUnitId: string): Promise<WorkUnitVersionRecord> {
  let record: WorkUnitVersionRecord | undefined;

  await db.transaction('rw', [db.workUnits, db.workUnitVersions], async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const contentObj = {
      name: wu.name,
      description: wu.description,
      slots: wu.slots,
      constraints: wu.constraints,
    };
    const content = JSON.stringify(contentObj);
    const contentHash = simpleHash(content);

    const existing = await db.workUnitVersions
      .where('workUnitId').equals(workUnitId)
      .sortBy('createdAt');
    const maxVersion = existing.length > 0
      ? Math.max(...existing.map((s) => s.versionNumber))
      : 0;

    record = {
      id: generateId(),
      workUnitId,
      versionNumber: maxVersion + 1,
      contentHash,
      content,
      createdAt: nowISO(),
    };

    await db.workUnitVersions.add(record);

    if (existing.length >= MAX_SNAPSHOTS) {
      const toDelete = existing.slice(0, existing.length - MAX_SNAPSHOTS + 1);
      await db.workUnitVersions.bulkDelete(toDelete.map((s) => s.id));
    }
  });

  return record!;
}

async function listSnapshots(workUnitId: string): Promise<WorkUnitVersionRecord[]> {
  const list = await db.workUnitVersions
    .where('workUnitId').equals(workUnitId)
    .sortBy('createdAt');
  return list.reverse();
}

async function restoreSnapshot(workUnitId: string, snapshotId: string): Promise<void> {
  await db.transaction('rw', [db.workUnits, db.workUnitVersions], async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const snapshot = await db.workUnitVersions.get(snapshotId);
    if (!snapshot) throw new Error(`快照 ${snapshotId} 不存在`);

    const parsed = JSON.parse(snapshot.content);

    await db.workUnits.update(workUnitId, {
      name: parsed.name,
      description: parsed.description,
      slots: parsed.slots,
      constraints: parsed.constraints,
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
  updateWorkUnitInfo,
  addSlot,
  updateSlot,
  deleteSlot,
  addCapability,
  updateCapability,
  deleteCapability,
  reorderCapabilities,
  addConstraint,
  updateConstraint,
  deleteConstraint,
  reorderConstraints,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  setSlotFillIn,
  clearSlotFillIn,
  cloneWorkUnit,
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  /** 暴露 db 实例用于测试 reset */
  _db: db,
};
