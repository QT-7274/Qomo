/**
 * LaunchPanelComponent — 启动面板（V1 启动入口与对象选择）
 *
 * V1 Story: 用户在此浏览、搜索、选择 Work Unit 进入启动会话。
 * 提供：最近使用快速选择、全量列表（含交接状态）、搜索过滤、空状态引导。
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLaunchPanel } from '../../hooks/useLaunchPanel';
import { formatRelativeTime } from '../../utils/formatUtil';
import type { HandoffStatus } from '../../utils/promptGeneratorUtil';

// ---------------------------------------------------------------------------
// 辅助
// ---------------------------------------------------------------------------

function handoffBadge(status: HandoffStatus): { label: string; color: string; bg: string } {
  switch (status) {
    case 'ready': return { label: '✅ 可启动', color: '#276749', bg: '#c6f6d5' };
    case 'partial': return { label: '⚠️ 部分准备', color: '#975a16', bg: '#fefcbf' };
    case 'incomplete': return { label: '❌ 需完善', color: '#9b2c2c', bg: '#fed7d7' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LaunchPanelComponent() {
  const {
    workUnits,
    recentLaunches,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectWorkUnit,
  } = useLaunchPanel();

  const navigate = useNavigate();
  const [selectError, setSelectError] = useState<string | null>(null);

  const handleSelect = async (workUnitId: string) => {
    try {
      setSelectError(null);
      await selectWorkUnit(workUnitId);
      navigate(`/launch/${workUnitId}`);
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : '选择失败，请重试');
    }
  };

  if (loading) {
    return <div style={pageStyle}><p>加载中…</p></div>;
  }

  if (error) {
    return <div style={pageStyle}><p style={{ color: '#e53e3e' }}>错误：{error}</p></div>;
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>🚀 启动台</h1>
        <Link to="/" style={backLinkStyle}>← 返回设计台</Link>
      </header>

      {/* 搜索 */}
      <div style={toolbarStyle}>
        <input
          type="text"
          placeholder="搜索 Work Unit…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
          aria-label="搜索 Work Unit"
        />
      </div>

      {/* 选择错误提示 */}
      {selectError && (
        <div style={errorBannerStyle}>
          ⚠️ {selectError}
        </div>
      )}

      {/* 空状态 */}
      {workUnits.length === 0 && !searchQuery ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>还没有 Work Unit</p>
          <p style={{ color: '#718096' }}>
            请先在 Web 设计台中创建 Work Unit，然后再来启动。
          </p>
          <Link to="/" style={linkBtnStyle}>前往设计台</Link>
        </div>
      ) : (
        <>
          {/* 最近使用 */}
          {recentLaunches.length > 0 && !searchQuery && (
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>最近使用</h2>
              <div style={recentListStyle}>
                {recentLaunches.map((r) => (
                  <button
                    key={`recent-${r.workUnitId}`}
                    type="button"
                    style={recentCardStyle}
                    onClick={() => handleSelect(r.workUnitId)}
                  >
                    <span style={recentNameStyle}>{r.workUnitName}</span>
                    <span style={recentTimeStyle}>{formatRelativeTime(r.lastLaunchedAt)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 所有 Work Unit */}
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              {searchQuery ? `搜索结果（${workUnits.length}）` : '所有 Work Unit'}
            </h2>
            {workUnits.length === 0 ? (
              <p style={{ color: '#718096', textAlign: 'center', padding: '1rem' }}>
                没有找到匹配「{searchQuery}」的 Work Unit
              </p>
            ) : (
              <ul style={listStyle}>
                {workUnits.map((wu) => {
                  const badge = handoffBadge(wu.handoffStatus);
                  return (
                    <li key={`wu-${wu.id}`} style={listItemStyle}>
                      <div
                        style={listItemContentStyle}
                        onClick={() => handleSelect(wu.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelect(wu.id)}
                      >
                        <div style={itemMainStyle}>
                          <span style={nameStyle}>{wu.name}</span>
                          {wu.description && (
                            <span style={descStyle}>
                              {wu.description.length > 40 ? wu.description.slice(0, 40) + '…' : wu.description}
                            </span>
                          )}
                        </div>
                        <div style={itemMetaStyle}>
                          <span style={{ ...badgeStyle, color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                          {wu.hasSnapshot && (
                            <span style={snapshotTagStyle}>有快照</span>
                          )}
                          <span style={timeStyle}>{formatRelativeTime(wu.updatedAt)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '2rem 1rem',
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: 0,
  color: '#1a202c',
};

const backLinkStyle: React.CSSProperties = {
  color: '#3182ce',
  textDecoration: 'none',
  fontSize: '0.9rem',
};

const toolbarStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.75rem',
};

const recentListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
};

const recentCardStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0.75rem 1rem',
  background: '#f7fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'left',
  minWidth: 120,
};

const recentNameStyle: React.CSSProperties = {
  fontWeight: 500,
  fontSize: '0.9rem',
  color: '#2d3748',
};

const recentTimeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#a0aec0',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const listItemStyle: React.CSSProperties = {
  borderBottom: '1px solid #edf2f7',
};

const listItemContentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  cursor: 'pointer',
  gap: '1rem',
};

const itemMainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const nameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#2d3748',
};

const descStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const itemMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexShrink: 0,
};

const badgeStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const snapshotTagStyle: React.CSSProperties = {
  padding: '0.1rem 0.4rem',
  background: '#ebf8ff',
  color: '#2b6cb0',
  borderRadius: '4px',
  fontSize: '0.7rem',
};

const timeStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#a0aec0',
  whiteSpace: 'nowrap',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#4a5568',
};

const errorBannerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: '#fed7d7',
  border: '1px solid #feb2b2',
  borderRadius: '6px',
  color: '#9b2c2c',
  fontSize: '0.85rem',
  marginBottom: '1rem',
};

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '1rem',
  padding: '0.5rem 1.5rem',
  background: '#3182ce',
  color: '#fff',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.9rem',
};
