/**
 * ContextCompletionSection — 上下文补齐表单
 *
 * V2 Story: 现场补齐上下文。
 * 替换 V1 的占位区域。
 */

import { useState } from 'react';
import type { UseLaunchContextReturn } from '../../hooks/useLaunchContext';

const methodLabels: Record<string, { label: string; color: string; bg: string }> = {
  auto: { label: '🟢 自动带入', color: '#276749', bg: '#f0fff4' },
  'user-confirm': { label: '🟡 需确认', color: '#975a16', bg: '#fefcbf' },
  manual: { label: '🔴 手动补齐', color: '#9b2c2c', bg: '#fed7d7' },
};

interface Props {
  ctx: UseLaunchContextReturn;
}

export function ContextCompletionSection({ ctx }: Props) {
  const [fileInput, setFileInput] = useState('');

  const handleAddFile = () => {
    const trimmed = fileInput.trim();
    if (trimmed) {
      ctx.addFile(trimmed);
      setFileInput('');
    }
  };

  const handleFileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFile();
    }
  };

  const requiredTotal = ctx.fillInItems.filter((i) => i.required).length;
  const requiredFilled = requiredTotal - ctx.missingRequired.length;
  const optionalTotal = ctx.fillInItems.filter((i) => !i.required).length;
  const optionalFilled = ctx.fillInItems.filter(
    (i) => !i.required && ctx.slotFillStatus[i.slotId] === 'filled',
  ).length;

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>现场补齐上下文</h2>

      {/* 完整性摘要 */}
      <div style={completenessBarStyle} data-testid="completeness-summary">
        <span style={completenessLabelStyle(ctx.completeness)}>
          {ctx.completeness === 'complete' && '✅ 上下文已就绪'}
          {ctx.completeness === 'partial' && '⚠️ 部分必需项待补齐'}
          {ctx.completeness === 'empty' && '📋 尚未填写任何上下文'}
        </span>
        <span style={countStyle}>
          必需 {requiredFilled}/{requiredTotal} | 可选 {optionalFilled}/{optionalTotal}
        </span>
      </div>

      {/* 缺失清单 */}
      {ctx.missingRequired.length > 0 && (
        <div style={missingListStyle} data-testid="missing-list">
          <p style={missingTitleStyle}>⚠️ 以下必需项待补齐：</p>
          <ul style={missingUlStyle}>
            {ctx.missingRequired.map((item) => (
              <li key={item.slotId} style={missingItemStyle}>
                <strong>{item.slotName}</strong>
                {item.hint && <span style={hintStyle}>— {item.hint}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 待补齐项清单（按 method 分组） */}
      {ctx.fillInItems.length > 0 && (
        <div style={fillInListStyle} data-testid="fillin-list">
          <h3 style={subTitleStyle}>待补齐项</h3>
          {ctx.fillInItems.map((item) => {
            const meta = methodLabels[item.method] ?? methodLabels.manual;
            return (
              <div key={item.slotId} style={fillInItemStyle}>
                <span style={{ ...methodBadge, color: meta.color, background: meta.bg }}>
                  {meta.label}
                </span>
                <span style={fillInNameStyle}>{item.slotName}</span>
                {item.required && <span style={requiredTag}>必需</span>}
                {item.hint && <span style={hintStyle}>{item.hint}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* 任务目标 */}
      <div style={fieldGroup}>
        <label style={labelStyle} htmlFor="ctx-task-goal">任务目标</label>
        <textarea
          id="ctx-task-goal"
          style={textareaStyle}
          placeholder="描述本次任务的具体目标…"
          value={ctx.taskGoal}
          onChange={(e) => ctx.setTaskGoal(e.target.value)}
          rows={3}
        />
      </div>

      {/* 仓库/项目 */}
      <div style={fieldGroup}>
        <label style={labelStyle} htmlFor="ctx-workspace">仓库 / 项目</label>
        <input
          id="ctx-workspace"
          style={inputStyle}
          type="text"
          placeholder="仓库名称或项目路径"
          value={ctx.workspace}
          onChange={(e) => ctx.setWorkspace(e.target.value)}
        />
      </div>

      {/* 相关文件 */}
      <div style={fieldGroup}>
        <label style={labelStyle}>相关文件</label>
        <div style={fileInputRow}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            type="text"
            placeholder="输入文件路径，按 Enter 添加"
            value={fileInput}
            onChange={(e) => setFileInput(e.target.value)}
            onKeyDown={handleFileKeyDown}
            data-testid="file-input"
          />
          <button style={addBtnStyle} onClick={handleAddFile} type="button">
            添加
          </button>
        </div>
        {ctx.files.length > 0 && (
          <ul style={fileListStyle} data-testid="file-list">
            {ctx.files.map((f) => (
              <li key={f} style={fileItemStyle}>
                <code style={filePathStyle}>{f}</code>
                <button
                  style={removeBtnStyle}
                  onClick={() => ctx.removeFile(f)}
                  type="button"
                  aria-label={`删除 ${f}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 附加说明 */}
      <div style={fieldGroup}>
        <label style={labelStyle} htmlFor="ctx-notes">附加说明</label>
        <textarea
          id="ctx-notes"
          style={textareaStyle}
          placeholder="其他需要补充的上下文信息…"
          value={ctx.additionalNotes}
          onChange={(e) => ctx.setAdditionalNotes(e.target.value)}
          rows={3}
        />
      </div>
    </section>
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

const completenessBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  background: '#f7fafc',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  marginBottom: '1rem',
};

function completenessLabelStyle(c: string): React.CSSProperties {
  const colorMap: Record<string, string> = {
    complete: '#276749',
    partial: '#975a16',
    empty: '#718096',
  };
  return { fontWeight: 600, color: colorMap[c] ?? '#718096' };
}

const countStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const missingListStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: '#fffbeb',
  border: '1px solid #f6e05e',
  borderRadius: '6px',
  marginBottom: '1rem',
};

const missingTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#975a16',
  fontSize: '0.85rem',
  marginBottom: '0.5rem',
};

const missingUlStyle: React.CSSProperties = {
  listStyle: 'disc',
  paddingLeft: '1.25rem',
  margin: 0,
};

const missingItemStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#744210',
  marginBottom: '0.25rem',
};

const fillInListStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const subTitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.5rem',
};

const fillInItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.4rem 0',
  borderBottom: '1px solid #edf2f7',
  flexWrap: 'wrap',
};

const methodBadge: React.CSSProperties = {
  fontSize: '0.7rem',
  padding: '0.15rem 0.4rem',
  borderRadius: '4px',
  fontWeight: 500,
};

const fillInNameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#2d3748',
  fontSize: '0.85rem',
};

const requiredTag: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#e53e3e',
  padding: '0.1rem 0.3rem',
  background: '#fed7d7',
  borderRadius: '4px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const fieldGroup: React.CSSProperties = {
  marginBottom: '1rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const fileInputRow: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const addBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#3182ce',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.8rem',
  cursor: 'pointer',
};

const fileListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const fileItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.3rem 0.5rem',
  background: '#f7fafc',
  borderRadius: '4px',
  marginBottom: '0.25rem',
};

const filePathStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#4a5568',
};

const removeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#e53e3e',
  cursor: 'pointer',
  fontSize: '0.85rem',
  padding: '0 0.25rem',
};
