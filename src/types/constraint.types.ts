/**
 * Constraint 共享类型定义
 *
 * W2b Story: 为 Work Unit 提供约束语义声明。
 *
 * 三种约束类型：
 * - output: 输出格式要求（格式 + 长度限制）
 * - boundary: 边界/守卫规则（文本描述）
 * - quality: 质量检查清单（检查项列表）
 *
 * === 扩展预留 ===
 * W2c 可能增加：待补齐项与约束的关联
 * V 系列可能增加：运行时约束可用性检查
 */

/** 约束类型 */
export type ConstraintType = 'output' | 'boundary' | 'quality';

/** 输出格式类型 */
export type OutputFormatType = 'markdown' | 'json' | 'table' | 'plaintext' | 'yaml' | 'csv';

/** 长度限制 */
export interface LengthLimit {
  /** 单位 */
  unit: 'characters' | 'words' | 'lines';
  /** 最小值（可选） */
  min?: number;
  /** 最大值（可选） */
  max?: number;
}

/** 质量检查项 */
export interface ChecklistItem {
  /** 唯一 ID */
  readonly id: string;
  /** 检查项文本 */
  text: string;
  /** 是否必需 */
  required: boolean;
  /** 排序序号 */
  order: number;
}

/** 约束包 */
export interface ConstraintPack {
  /** 唯一 ID */
  readonly id: string;
  /** 用户可见名称 */
  name: string;
  /** 约束类型 */
  constraintType: ConstraintType;
  /** 约束内容（文本描述） */
  content: string;
  /** 排序序号 */
  order: number;
  /** 输出格式（仅 output 类型） */
  outputFormat?: OutputFormatType;
  /** 长度限制（仅 output 类型） */
  lengthLimit?: LengthLimit;
  /** 检查清单（仅 quality 类型） */
  checklistItems?: ChecklistItem[];
}
