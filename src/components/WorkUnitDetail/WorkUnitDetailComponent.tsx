/**
 * WorkUnitDetailComponent — Work Unit 详情/编辑占位页面
 *
 * W1 Story: 导航链路占位。W2a 将承接结构声明功能。
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { StorageService, type WorkUnitRecord } from '../../services/StorageService';

export function WorkUnitDetailComponent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workUnit, setWorkUnit] = useState<WorkUnitRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    StorageService.getWorkUnit(id).then((record) => {
      setWorkUnit(record ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div style={pageStyle}><p>加载中…</p></div>;
  }

  if (!workUnit) {
    return (
      <div style={pageStyle}>
        <p>Work Unit 不存在。</p>
        <button type="button" style={backBtnStyle} onClick={() => navigate('/')}>
          ← 返回列表
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button type="button" style={backBtnStyle} onClick={() => navigate('/')}>
        ← 返回列表
      </button>
      <h1 style={titleStyle}>{workUnit.name}</h1>
      <dl style={dlStyle}>
        <dt>ID</dt><dd style={ddStyle}>{workUnit.id}</dd>
        <dt>来源</dt><dd style={ddStyle}>{workUnit.sourceType}</dd>
        <dt>创建时间</dt><dd style={ddStyle}>{workUnit.createdAt}</dd>
        <dt>修改时间</dt><dd style={ddStyle}>{workUnit.updatedAt}</dd>
      </dl>
      <p style={placeholderStyle}>
        结构声明与编辑功能将在 W2a 中实现。
      </p>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '2rem 1rem',
  fontFamily: 'system-ui, sans-serif',
};

const backBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  background: '#edf2f7',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: '#4a5568',
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1a202c',
  marginBottom: '1rem',
};

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '0.5rem 1rem',
  fontSize: '0.9rem',
};

const ddStyle: React.CSSProperties = {
  margin: 0,
  color: '#718096',
  wordBreak: 'break-all',
};

const placeholderStyle: React.CSSProperties = {
  marginTop: '2rem',
  padding: '1rem',
  background: '#f7fafc',
  borderRadius: '8px',
  color: '#718096',
  textAlign: 'center',
};
