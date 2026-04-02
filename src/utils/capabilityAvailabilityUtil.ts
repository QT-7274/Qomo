/**
 * capabilityAvailabilityUtil — 能力可用性判定 + 汇总纯函数
 *
 * V3a Story: capability 可用性总览。
 * 所有函数均为纯函数，无副作用。
 *
 * Web SPA 阶段采用模拟判定策略：
 * - content 非空 → ready
 * - content 空 → missing
 * 后续 VS Code 扩展只需替换 assessSingleCapability 实现。
 */

import type { Slot } from '../types/slot.types';
import type { Capability } from '../types/capability.types';
import type {
  AvailabilityStatus,
  CapabilityAvailabilityItem,
  AvailabilitySummary,
} from '../types/capabilityAvailability.types';

/** blocked 状态集合 */
const BLOCKED_STATUSES: ReadonlySet<AvailabilityStatus> = new Set([
  'missing',
  'version_incompatible',
  'permission_denied',
]);

/**
 * 对单个 Capability 进行可用性判定。
 *
 * Web SPA 模拟策略：content 有内容 → ready，否则 → missing。
 * 后续 VS Code 扩展替换此函数即可接入真实 runtime discovery。
 */
function assessSingleCapability(
  cap: Capability,
  slot: Slot,
): CapabilityAvailabilityItem {
  const hasContent = cap.content != null && cap.content.trim().length > 0;
  const status: AvailabilityStatus = hasContent ? 'ready' : 'missing';

  return {
    capabilityId: cap.id,
    capabilityName: cap.name,
    slotId: slot.id,
    slotName: slot.name,
    status,
    issueType: status !== 'ready' ? status : undefined,
    description: status === 'missing' ? '能力内容为空，无法在当前环境中使用' : undefined,
  };
}

/**
 * 遍历所有 Slot 的 Capability，按模拟策略判定可用性。
 * 无 Capability 的 Slot 不产生条目。
 */
export function assessCapabilityAvailability(
  slots: Slot[],
): CapabilityAvailabilityItem[] {
  const items: CapabilityAvailabilityItem[] = [];
  for (const slot of slots) {
    for (const cap of (slot.capabilities ?? [])) {
      items.push(assessSingleCapability(cap, slot));
    }
  }
  return items;
}

/**
 * 计算可用性汇总统计。
 *
 * - readyCount: status === 'ready'
 * - blockedCount: status in { missing, version_incompatible, permission_denied }
 * - ambiguousCount: status === 'ambiguous_candidate'
 */
export function summarizeAvailability(
  items: CapabilityAvailabilityItem[],
): AvailabilitySummary {
  let readyCount = 0;
  let blockedCount = 0;
  let ambiguousCount = 0;

  for (const item of items) {
    if (item.status === 'ready') {
      readyCount++;
    } else if (item.status === 'ambiguous_candidate') {
      ambiguousCount++;
    } else if (BLOCKED_STATUSES.has(item.status)) {
      blockedCount++;
    }
  }

  return { readyCount, blockedCount, ambiguousCount, items };
}
