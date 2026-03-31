/**
 * WorkUnitListComponent — Work Unit 列表页面
 *
 * W1 Story: 继续治理入口。
 * 提供：列表展示、名称搜索、时间排序、删除确认、空状态引导。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkUnits } from '../../hooks/useWorkUnits';
import type { SortField } from '../../services/StorageService';

// ---------------------------------------------------------------------------
// 辅助：相对时间格式化
// ---------------------------------------------------------------------------

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHr < 24) return `${diffHr} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}

/** 来源类型的中文标签 */
function sourceTypeLabel(sourceType: string): string {
  switch (sourceType) {
    case 'created_new': return '全新';
    case 'cloned_from': return '克隆';
    case 'restored_from': return '恢复';
    default: return sourceType;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkUnitListComponent() {
  const {
    workUnits,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    createWorkUnit,
    deleteWorkUnit,
    cloneWorkUnit,
  } = useWorkUnits();

  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createWorkUnit(trimmed);
    setNewName('');
    setCreating(false);
  };

  const handleClone = async (id: string) => {
    await cloneWorkUnit(id);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`确定要删除「${name}」吗？此操作不可撤销。`)) {
      await deleteWorkUnit(id);
    }
  };

  const handleSortChange = (field: SortField) => {
    setSortBy(field);
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
        <h1 style={titleStyle}>Work Units</h1>
        <button type="button" style={primaryBtnStyle} onClick={() => setCreating(true)}>
          + 新建
        </button>
      </header>

      {/* 创建表单 */}
      {creating && (
        <div style={createFormStyle}>
          <input
            type="text"
            placeholder="输入 Work Unit 名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={inputStyle}
            autoFocus
          />
          <button type="button" style={primaryBtnStyle} onClick={handleCreate}>创建</button>
          <button type="button" style={secondaryBtnStyle} onClick={() => { setCreating(false); setNewName(''); }}>取消</button>
        </div>
      )}

      {/* 搜索 + 排序 */}
      <div style={toolbarStyle}>
        <input
          type="text"
          placeholder="搜索 Work Unit…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
          aria-label="搜索 Work Unit"
        />
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortField)}
          style={selectStyle}
          aria-label="排序方式"
        >
          <option value="updatedAt">按修改时间</option>
          <option value="createdAt">按创建时间</option>
        </select>
      </div>

      {/* 列表 / 空状态 */}
      {workUnits.length === 0 ? (
        <div style={emptyStateStyle}>
          {searchQuery ? (
            <p>没有找到匹配「{searchQuery}」的 Work Unit</p>
          ) : (
            <>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>还没有 Work Unit</p>
              <p style={{ color: '#718096' }}>创建一个新的 Work Unit 开始使用，或导入资产包。</p>
              <button type="button" style={primaryBtnStyle} onClick={() => setCreating(true)}>
                创建第一个 Work Unit
              </button>
            </>
          )}
        </div>
      ) : (
        <ul style={listStyle}>
          {workUnits.map((wu) => (
            <li
              key={`wu-${wu.id}`}
              style={listItemStyle}
            >
              <div
                style={listItemContentStyle}
                onClick={() => navigate(`/work-unit/${wu.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/work-unit/${wu.id}`)}
              >
                <span style={nameStyle}>{wu.name}</span>
                <span style={metaStyle}>
                  <span style={sourceTagStyle}>{sourceTypeLabel(wu.sourceType)}</span>
                  {formatRelativeTime(wu.updatedAt)}
                </span>
              </div>
              <button
                type="button"
                style={cloneListBtnStyle}
                onClick={() => handleClone(wu.id)}
                aria-label={`复制 ${wu.name}`}
              >
                ⧉
              </button>
              <button
                type="button"
                style={deleteBtnStyle}
                onClick={() => handleDelete(wu.id, wu.name)}
                aria-label={`删除 ${wu.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
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
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: 0,
  color: '#1a202c',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.9rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.9rem',
  background: '#fff',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.9rem',
};

const createFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
  padding: '0.75rem',
  background: '#f7fafc',
  borderRadius: '8px',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#3182ce',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#e2e8f0',
  color: '#4a5568',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem',
  borderBottom: '1px solid #edf2f7',
  gap: '0.5rem',
};

const listItemContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

const nameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#2d3748',
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const sourceTagStyle: React.CSSProperties = {
  padding: '0.1rem 0.4rem',
  background: '#edf2f7',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#718096',
};

const cloneListBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  background: 'transparent',
  border: 'none',
  color: '#a0aec0',
  cursor: 'pointer',
  fontSize: '1rem',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  background: 'transparent',
  border: 'none',
  color: '#a0aec0',
  cursor: 'pointer',
  fontSize: '1rem',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#4a5568',
};
