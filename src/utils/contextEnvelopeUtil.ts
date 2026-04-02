/**
 * contextEnvelopeUtil — 待补齐项提取 + 完整性计算纯函数
 *
 * V2 Story: 现场补齐上下文。
 * 所有函数均为纯函数，无副作用。
 *
 * 按 fillIn.method 类型将通用输入字段映射到 Slot：
 * - auto  → workspace（仓库/项目信息）
 * - user-confirm → taskGoal（任务目标）
 * - manual → additionalNotes（附加说明）
 * - files 列表独立贡献：有文件即视为额外补齐
 */

import type { Slot } from '../types/slot.types';
import type { FillInMethod } from '../types/fillIn.types';
import type { FillInItem, ContextCompleteness, SlotFillStatus, LaunchContextEnvelope } from '../types/launch.types';

/**
 * 从 Slot 列表中提取所有带 fillIn 声明的待补齐项。
 * 无 fillIn 的 Slot 不参与补齐流程。
 */
export function extractFillInItems(slots: Slot[]): FillInItem[] {
  return slots
    .filter((slot): slot is Slot & { fillIn: NonNullable<Slot['fillIn']> } => slot.fillIn != null)
    .map((slot) => ({
      slotId: slot.id,
      slotName: slot.name,
      method: slot.fillIn.method,
      hint: slot.fillIn.hint,
      required: slot.required,
    }));
}

/**
 * 判断某个 fillIn method 对应的通用输入是否已提供。
 *
 * 映射规则：
 * - auto  → workspace 非空（仓库路径等自动采集项）
 * - user-confirm → taskGoal 非空（需用户确认的任务目标）
 * - manual → additionalNotes 非空（手动补充说明）
 *
 * files 列表作为额外贡献：有文件则所有 method 都受益。
 */
function isMethodSatisfied(
  method: FillInMethod,
  envelope: Partial<LaunchContextEnvelope>,
): boolean {
  const hasFiles = (envelope.files?.length ?? 0) > 0;

  switch (method) {
    case 'auto':
      return hasNonEmpty(envelope.workspace) || hasFiles;
    case 'user-confirm':
      return hasNonEmpty(envelope.taskGoal) || hasFiles;
    case 'manual':
      return hasNonEmpty(envelope.additionalNotes) || hasFiles;
    default:
      return false;
  }
}

/**
 * 计算逐 Slot 补齐状态。
 * 按 Slot 的 fillIn.method 判断对应的通用输入是否已提供。
 */
export function computeSlotFillStatus(
  items: FillInItem[],
  envelope: Partial<LaunchContextEnvelope>,
): SlotFillStatus {
  const status: SlotFillStatus = {};
  for (const item of items) {
    status[item.slotId] = isMethodSatisfied(item.method, envelope) ? 'filled' : 'empty';
  }
  return status;
}

/**
 * 计算整体完整性状态。
 *
 * - complete: 所有 required fillIn 项对应的通用输入已非空
 * - partial: 至少有一项输入，但仍有 required 项未满足
 * - empty: 没有任何输入
 */
export function computeCompleteness(
  items: FillInItem[],
  envelope: Partial<LaunchContextEnvelope>,
): ContextCompleteness {
  // 无待补齐项 → 视为 complete
  if (items.length === 0) return 'complete';

  const statuses = items.map((it) => isMethodSatisfied(it.method, envelope));
  const anyFilled = statuses.some(Boolean);

  if (!anyFilled) return 'empty';

  // 检查所有 required 项是否满足
  const allRequiredSatisfied = items
    .filter((it) => it.required)
    .every((it) => isMethodSatisfied(it.method, envelope));

  if (allRequiredSatisfied) return 'complete';

  return 'partial';
}

/**
 * 返回缺失的必需项列表（已满足的不返回）。
 */
export function getMissingRequiredItems(
  items: FillInItem[],
  envelope: Partial<LaunchContextEnvelope>,
): FillInItem[] {
  return items.filter((it) => it.required && !isMethodSatisfied(it.method, envelope));
}

// ---------------------------------------------------------------------------
// 内部辅助
// ---------------------------------------------------------------------------

/** 判断字符串是否非空（trim 后有内容） */
function hasNonEmpty(value: string | undefined): boolean {
  return value != null && value.trim().length > 0;
}
