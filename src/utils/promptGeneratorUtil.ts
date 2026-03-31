/**
 * Prompt 预览生成 + 交接准备状态计算
 *
 * W3 Story: 纯函数，不触碰 Dexie 或任何 side effect。
 * 输入 WorkUnitRecord，输出结构化 Prompt 文本或状态。
 */

import type { WorkUnitRecord } from '../services/StorageService';
import type { ConstraintPack } from '../types/constraint.types';

/** 交接准备状态 */
export type HandoffStatus = 'ready' | 'partial' | 'incomplete';

const slotTypeLabels: Record<string, string> = {
  context: '上下文', rule: '规则', output: '输出', capability: '能力', custom: '自定义',
};

const constraintTypeLabels: Record<string, string> = {
  output: '输出', boundary: '边界规则', quality: '质量检查',
};

const outputFormatLabels: Record<string, string> = {
  markdown: 'Markdown', json: 'JSON', table: '表格', plaintext: '纯文本', yaml: 'YAML', csv: 'CSV',
};

const lengthUnitLabels: Record<string, string> = {
  characters: '字符', words: '词', lines: '行',
};

/** 基于 Work Unit 结构生成 Prompt 预览文本 */
export function generatePromptPreview(wu: WorkUnitRecord): string {
  const parts: string[] = [];

  for (const slot of wu.slots) {
    const typeLabel = slotTypeLabels[slot.slotType] ?? slot.slotType;
    let header = `## ${slot.name}（${typeLabel}）`;

    if (slot.fillIn) {
      header += `\n\n[待补齐: ${slot.name}]`;
    }

    const sortedCaps = [...slot.capabilities].sort((a, b) => a.order - b.order);
    const capTexts = sortedCaps.map((c) => c.content).filter(Boolean);

    if (capTexts.length > 0 || slot.fillIn) {
      parts.push(header + (capTexts.length > 0 ? '\n\n' + capTexts.join('\n\n') : ''));
    }
  }

  if (wu.constraints.length > 0) {
    const sorted = [...wu.constraints].sort((a, b) => a.order - b.order);
    const constraintTexts = sorted.map((cp) => renderConstraint(cp));
    parts.push('---\n\n' + constraintTexts.join('\n\n'));
  }

  return parts.join('\n\n');
}

function renderConstraint(cp: ConstraintPack): string {
  const typeLabel = constraintTypeLabels[cp.constraintType] ?? cp.constraintType;
  let text = `### ${cp.name}（${typeLabel}）\n\n${cp.content}`;

  if (cp.constraintType === 'output') {
    if (cp.outputFormat) {
      const fmtLabel = outputFormatLabels[cp.outputFormat] ?? cp.outputFormat;
      text += `\n\n格式要求: ${fmtLabel}`;
    }
    if (cp.lengthLimit) {
      const unitLabel = lengthUnitLabels[cp.lengthLimit.unit] ?? cp.lengthLimit.unit;
      const { min, max } = cp.lengthLimit;
      if (min != null && max != null) {
        text += `\n\n长度限制: ${min}-${max} ${unitLabel}`;
      } else if (max != null) {
        text += `\n\n长度限制: ≤${max} ${unitLabel}`;
      } else if (min != null) {
        text += `\n\n长度限制: ≥${min} ${unitLabel}`;
      }
    }
  }

  if (cp.constraintType === 'quality' && cp.checklistItems && cp.checklistItems.length > 0) {
    const sorted = [...cp.checklistItems].sort((a, b) => a.order - b.order);
    const items = sorted.map((ci) => ci.required ? `- [必需] ${ci.text}` : `- ${ci.text}`);
    text += '\n\n' + items.join('\n');
  }

  return text;
}

/** 计算交接准备状态 */
export function getHandoffReadiness(wu: WorkUnitRecord): HandoffStatus {
  if (wu.slots.length === 0) return 'incomplete';

  const requiredSlots = wu.slots.filter((s) => s.required);

  // Any required slot missing capabilities (and no fillIn) → incomplete
  for (const slot of requiredSlots) {
    if (slot.capabilities.length === 0 && !slot.fillIn) return 'incomplete';
  }

  // Any required slot with fillIn → incomplete
  for (const slot of requiredSlots) {
    if (slot.fillIn) return 'incomplete';
  }

  // Non-required slots with fillIn → partial
  const hasNonRequiredFillIn = wu.slots.some((s) => !s.required && s.fillIn);
  if (hasNonRequiredFillIn) return 'partial';

  return 'ready';
}
