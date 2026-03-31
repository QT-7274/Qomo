/**
 * Slot 共享类型定义
 *
 * W2a Story: 为 Work Unit 提供结构化的能力挂载点。
 *
 * Slot 是 Work Unit 内部的结构骨架节点，
 * 按类型分类（context / rule / output / capability / custom），
 * 每个 Slot 下可挂载多个 Capability。
 *
 * === 扩展预留 ===
 * W2b 可能增加：约束语义（constraints）、输出格式声明
 * W2c: 待补齐项语义（fillIn）
 */

import type { Capability } from './capability.types';
import type { FillInDeclaration } from './fillIn.types';

/** Slot 类型枚举 */
export type SlotType = 'context' | 'rule' | 'output' | 'capability' | 'custom';

/** Work Unit 中的结构化挂载点 */
export interface Slot {
  /** 唯一 ID（UUID） */
  readonly id: string;

  /** 用户可见名称 */
  name: string;

  /** Slot 类型 */
  slotType: SlotType;

  /** 可选描述 */
  description?: string;

  /** 是否为必需 Slot */
  required: boolean;

  /** 挂载的 Capability 列表（按 order 排序） */
  capabilities: Capability[];

  /** 待补齐声明（可选，undefined 表示设计时已完全定义） */
  fillIn?: FillInDeclaration;
}
