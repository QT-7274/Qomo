/**
 * useCapabilityAvailability — 能力可用性状态 Hook
 *
 * V3a Story: capability 可用性总览。
 * Component → Hook → Util（不涉及 Service/Dexie 层）。
 */

import { useMemo } from 'react';
import type { Slot } from '../types/slot.types';
import type {
  CapabilityAvailabilityItem,
  AvailabilitySummary,
} from '../types/capabilityAvailability.types';
import {
  assessCapabilityAvailability,
  summarizeAvailability,
} from '../utils/capabilityAvailabilityUtil';

export interface UseCapabilityAvailabilityReturn {
  /** 所有 Capability 的可用性条目 */
  items: CapabilityAvailabilityItem[];
  /** 汇总统计 */
  summary: AvailabilitySummary;
  /** 是否全部就绪 */
  allReady: boolean;
}

export function useCapabilityAvailability(
  slots: Slot[],
): UseCapabilityAvailabilityReturn {
  const items = useMemo(
    () => assessCapabilityAvailability(slots),
    [slots],
  );

  const summary = useMemo(
    () => summarizeAvailability(items),
    [items],
  );

  const allReady = useMemo(
    () => items.length > 0 && summary.readyCount === items.length,
    [items, summary],
  );

  return { items, summary, allReady };
}
