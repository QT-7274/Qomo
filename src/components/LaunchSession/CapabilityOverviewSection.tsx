/**
 * CapabilityOverviewSection — 能力可用性总览
 *
 * V3a Story: capability 可用性总览。
 * 展示 ready / blocked / ambiguous 三分组。
 */

import { useState } from 'react';
import type { UseCapabilityAvailabilityReturn } from '../../hooks/useCapabilityAvailability';
import type { CapabilityAvailabilityItem } from '../../types/capabilityAvailability.types';

const statusLabels: Record<string, { icon: string; label: string; color: string }> = {
  ready: { icon: '✅', label: '可用', color: '#276749' },
  missing: { icon: '❌', label: '缺失', color: '#9b2c2c' },
  version_incompatible: { icon: '❌', label: '版本不兼容', color: '#9b2c2c' },
  permission_denied: { icon: '🔒', label: '权限不足', color: '#9b2c2c' },
  ambiguous_candidate: { icon: '⚠️', label: '候选歧义', color: '#975a16' },
};

interface Props {
  availability: UseCapabilityAvailabilityReturn;
}

export function CapabilityOverviewSection({ availability }: Props) {
  const { items, summary, allReady } = availability;
  const [showReady, setShowReady] = useState(false);

  // 无 Capability 空态
  if (items.length === 0) {
    return (
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>能力可用性</h2>
        <p style={emptyHint} data-testid="no-capability-hint">当前无声明能力</p>
      </section>
    );
  }

  const readyItems = items.filter((i) => i.status === 'ready');
  const blockedItems = items.filter((i) =>
    i.status === 'missing' || i.status === 'version_incompatible' || i.status === 'permission_denied',
  );
  const ambiguousItems = items.filter((i) => i.status === 'ambiguous_candidate');

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>能力可用性</h2>

      {/* 统计摘要 */}
      <div style={summaryBarStyle} data-testid="availability-summary">
        <span style={summaryChip('#c6f6d5', '#276749')}>
          已就绪 {summary.readyCount}
        </span>
        {summary.blockedCount > 0 && (
          <span style={summaryChip('#fed7d7', '#9b2c2c')}>
            阻塞 {summary.blockedCount}
          </span>
        )}
        {summary.ambiguousCount > 0 && (
          <span style={summaryChip('#fefcbf', '#975a16')}>
            待决 {summary.ambiguousCount}
          </span>
        )}
      </div>

      {/* 全部就绪正向确认 */}
      {allReady && (
        <div style={allReadyStyle} data-testid="all-ready-banner">
          ✅ 所有能力均已就绪
        </div>
      )}

      {/* 阻塞分组 */}
      {blockedItems.length > 0 && (
        <div style={groupStyle} data-testid="blocked-group">
          <h3 style={groupTitleStyle('#9b2c2c')}>❌ 阻塞 ({blockedItems.length})</h3>
          <ul style={listStyle}>
            {blockedItems.map((item) => (
              <AvailabilityRow key={item.capabilityId} item={item} />
            ))}
          </ul>
        </div>
      )}

      {/* 待决分组 */}
      {ambiguousItems.length > 0 && (
        <div style={groupStyle} data-testid="ambiguous-group">
          <h3 style={groupTitleStyle('#975a16')}>⚠️ 待决 ({ambiguousItems.length})</h3>
          <ul style={listStyle}>
            {ambiguousItems.map((item) => (
              <AvailabilityRow key={item.capabilityId} item={item} />
            ))}
          </ul>
        </div>
      )}

      {/* 已就绪分组（默认折叠） */}
      {readyItems.length > 0 && !allReady && (
        <div style={groupStyle} data-testid="ready-group">
          <h3
            style={{ ...groupTitleStyle('#276749'), cursor: 'pointer' }}
            onClick={() => setShowReady((v) => !v)}
          >
            ✅ 已就绪 ({readyItems.length}) {showReady ? '▾' : '▸'}
          </h3>
          {showReady && (
            <ul style={listStyle}>
              {readyItems.map((item) => (
                <AvailabilityRow key={item.capabilityId} item={item} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 子组件
// ---------------------------------------------------------------------------

function AvailabilityRow({ item }: { item: CapabilityAvailabilityItem }) {
  const meta = statusLabels[item.status] ?? statusLabels.missing;
  return (
    <li style={rowStyle}>
      <span style={iconStyle}>{meta.icon}</span>
      <span style={capNameStyle}>{item.capabilityName}</span>
      <span style={slotTagStyle}>{item.slotName}</span>
      <span style={{ ...statusTextStyle, color: meta.color }}>{meta.label}</span>
      {item.description && <span style={descStyle}>{item.description}</span>}
    </li>
  );
}

// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#2d3748',
  marginBottom: '1rem',
};

const emptyHint: React.CSSProperties = {
  color: '#a0aec0',
  fontStyle: 'italic',
  fontSize: '0.85rem',
};

const summaryBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginBottom: '1rem',
};

function summaryChip(bg: string, color: string): React.CSSProperties {
  return {
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: bg,
    color,
  };
}

const allReadyStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: '#f0fff4',
  border: '1px solid #c6f6d5',
  borderRadius: '6px',
  color: '#276749',
  fontWeight: 600,
  fontSize: '0.9rem',
  marginBottom: '1rem',
};

const groupStyle: React.CSSProperties = {
  marginBottom: '1rem',
};

function groupTitleStyle(color: string): React.CSSProperties {
  return {
    fontSize: '0.9rem',
    fontWeight: 600,
    color,
    marginBottom: '0.5rem',
  };
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.4rem 0',
  borderBottom: '1px solid #edf2f7',
  flexWrap: 'wrap',
};

const iconStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  flexShrink: 0,
};

const capNameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#2d3748',
  fontSize: '0.85rem',
};

const slotTagStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#718096',
  padding: '0.1rem 0.4rem',
  background: '#edf2f7',
  borderRadius: '4px',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
};

const descStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#a0aec0',
  width: '100%',
  paddingLeft: '1.4rem',
};
