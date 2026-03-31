/**
 * WorkUnitDetailComponent — Work Unit 结构化编辑器
 *
 * W2a Story: 支持名称/描述编辑、Slot CRUD、Capability CRUD 与排序。
 *
 * 所有数据操作通过 useWorkUnitEditor hook 完成，不直接调用 StorageService。
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { useWorkUnitEditor } from '../../hooks/useWorkUnitEditor';
import type { SlotType, Slot, Capability, ConstraintType, ConstraintPack, FillInMethod } from '../../types';
import { generatePromptPreview, getHandoffReadiness } from '../../utils/promptGeneratorUtil';
import type { HandoffStatus } from '../../utils/promptGeneratorUtil';
import type { WorkUnitVersionRecord } from '../../services/StorageService';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const slotTypeLabels: Record<SlotType, string> = {
  context: '上下文',
  rule: '规则',
  output: '输出',
  capability: '能力',
  custom: '自定义',
};

const slotTypeOptions: SlotType[] = ['context', 'rule', 'output', 'capability', 'custom'];

const constraintTypeLabels: Record<ConstraintType, string> = {
  output: '输出',
  boundary: '边界规则',
  quality: '质量检查',
};

const constraintTypeOptions: ConstraintType[] = ['output', 'boundary', 'quality'];

const fillInMethodLabels: Record<FillInMethod, string> = {
  auto: '自动提取',
  'user-confirm': '用户确认',
  manual: '手动输入',
};

const fillInMethodOptions: FillInMethod[] = ['auto', 'user-confirm', 'manual'];

const handoffStatusLabels: Record<HandoffStatus, string> = {
  ready: '✅ 可交接',
  partial: '⚠️ 部分准备',
  incomplete: '❌ 需完善',
};

const handoffStatusStyles: Record<HandoffStatus, React.CSSProperties> = {
  ready: { padding: '0.25rem 0.75rem', background: '#c6f6d5', color: '#276749', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
  partial: { padding: '0.25rem 0.75rem', background: '#fefcbf', color: '#975a16', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
  incomplete: { padding: '0.25rem 0.75rem', background: '#fed7d7', color: '#c53030', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
};

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export function WorkUnitDetailComponent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editor = useWorkUnitEditor(id);

  // 名称 / 描述本地编辑态
  const [localName, setLocalName] = useState<string | null>(null);
  const [localDesc, setLocalDesc] = useState<string | null>(null);

  // 添加 Slot 表单
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotType, setNewSlotType] = useState<SlotType>('context');
  const [newSlotDesc, setNewSlotDesc] = useState('');
  const [newSlotRequired, setNewSlotRequired] = useState(false);

  // 添加 Capability 表单（按 slotId 切换）
  const [addCapSlotId, setAddCapSlotId] = useState<string | null>(null);
  const [newCapName, setNewCapName] = useState('');
  const [newCapContent, setNewCapContent] = useState('');

  // 添加约束表单
  const [showAddConstraint, setShowAddConstraint] = useState(false);
  const [newConstraintName, setNewConstraintName] = useState('');
  const [newConstraintType, setNewConstraintType] = useState<ConstraintType>('output');
  const [newConstraintContent, setNewConstraintContent] = useState('');

  // 预览状态
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // 版本历史
  const [snapshots, setSnapshots] = useState<WorkUnitVersionRecord[]>([]);
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false);

  const loadSnapshots = useCallback(async () => {
    const list = await editor.listSnapshots();
    setSnapshots(list);
    setSnapshotsLoaded(true);
  }, [editor]);

  useEffect(() => {
    if (editor.workUnit) {
      loadSnapshots();
    }
  }, [editor.workUnit, loadSnapshots]);

  // ---------- 加载 / 错误 ----------

  if (editor.loading) {
    return <div style={pageStyle}><p>加载中…</p></div>;
  }

  if (!editor.workUnit) {
    return (
      <div style={pageStyle}>
        <p>Work Unit 不存在。</p>
        <button type="button" style={btnSecondary} onClick={() => navigate('/')}>
          ← 返回列表
        </button>
      </div>
    );
  }

  const wu = editor.workUnit;

  const handoffStatus: HandoffStatus = getHandoffReadiness(wu);
  const hasContent = wu.slots.some((s) => s.capabilities.length > 0) || wu.constraints.length > 0;

  const handleNameBlur = () => {
    if (localName !== null && localName !== wu.name) {
      editor.updateInfo({ name: localName });
    }
    setLocalName(null);
  };

  // ---------- 描述 blur ----------

  const handleDescBlur = () => {
    if (localDesc !== null && localDesc !== wu.description) {
      editor.updateInfo({ description: localDesc });
    }
    setLocalDesc(null);
  };

  // ---------- Slot 添加 ----------

  const handleAddSlot = async () => {
    if (!newSlotName.trim()) return;
    await editor.addSlot({
      name: newSlotName.trim(),
      slotType: newSlotType,
      description: newSlotDesc.trim() || undefined,
      required: newSlotRequired,
    });
    setNewSlotName('');
    setNewSlotType('context');
    setNewSlotDesc('');
    setNewSlotRequired(false);
    setShowAddSlot(false);
  };

  // ---------- Slot 删除 ----------

  const handleDeleteSlot = async (slot: Slot) => {
    if (slot.capabilities.length > 0) {
      window.alert('Slot 下仍有 Capability，请先删除所有 Capability。');
      return;
    }
    if (window.confirm(`确认删除 Slot「${slot.name}」？`)) {
      await editor.deleteSlot(slot.id);
    }
  };

  // ---------- Capability 添加 ----------

  const handleAddCapability = async (slotId: string) => {
    if (!newCapName.trim()) return;
    await editor.addCapability(slotId, {
      name: newCapName.trim(),
      content: newCapContent,
    });
    setNewCapName('');
    setNewCapContent('');
    setAddCapSlotId(null);
  };

  // ---------- Capability 删除 ----------

  const handleDeleteCapability = async (slotId: string, cap: Capability) => {
    if (window.confirm(`确认删除 Capability「${cap.name}」？`)) {
      await editor.deleteCapability(slotId, cap.id);
    }
  };

  // ---------- Capability 上移 / 下移 ----------

  const handleMoveCapability = async (slot: Slot, capIndex: number, direction: 'up' | 'down') => {
    const sorted = [...slot.capabilities].sort((a, b) => a.order - b.order);
    const ids = sorted.map((c) => c.id);
    const swapIndex = direction === 'up' ? capIndex - 1 : capIndex + 1;
    if (swapIndex < 0 || swapIndex >= ids.length) return;
    [ids[capIndex], ids[swapIndex]] = [ids[swapIndex], ids[capIndex]];
    await editor.reorderCapabilities(slot.id, ids);
  };

  // ---------- 复制 ----------

  const handleClone = async () => {
    const newId = await editor.cloneWorkUnit();
    navigate(`/work-unit/${newId}`);
  };

  // ---------- 约束添加 ----------

  const handleAddConstraint = async () => {
    if (!newConstraintName.trim()) return;
    await editor.addConstraint({
      name: newConstraintName.trim(),
      constraintType: newConstraintType,
      content: newConstraintContent,
    });
    setNewConstraintName('');
    setNewConstraintType('output');
    setNewConstraintContent('');
    setShowAddConstraint(false);
  };

  // ---------- 约束删除 ----------

  const handleDeleteConstraint = async (cp: ConstraintPack) => {
    if (window.confirm(`确认删除约束「${cp.name}」？`)) {
      await editor.deleteConstraint(cp.id);
    }
  };

  // ---------- 约束排序 ----------

  const handleMoveConstraint = async (cpIndex: number, direction: 'up' | 'down') => {
    const sorted = [...wu.constraints].sort((a, b) => a.order - b.order);
    const ids = sorted.map((c) => c.id);
    const swapIndex = direction === 'up' ? cpIndex - 1 : cpIndex + 1;
    if (swapIndex < 0 || swapIndex >= ids.length) return;
    [ids[cpIndex], ids[swapIndex]] = [ids[swapIndex], ids[cpIndex]];
    await editor.reorderConstraints(ids);
  };

  // ---------- 预览 ----------

  const handleGeneratePreview = () => {
    const text = generatePromptPreview(wu);
    setPreviewText(text);
  };

  const handleCopy = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      window.alert('复制失败，请手动选择文本复制。');
    }
  };

  const handleDownload = () => {
    if (!previewText) return;
    const blob = new Blob([previewText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wu.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateSnapshot = async () => {
    await editor.createSnapshot();
    await loadSnapshots();
  };

  const handleRestoreSnapshot = async (snapshotId: string, versionNumber: number) => {
    if (window.confirm(`确认恢复到版本 v${versionNumber}？当前未保存的修改将被覆盖。`)) {
      await editor.restoreSnapshot(snapshotId);
      await loadSnapshots();
    }
  };

  // ---------- 渲染 ----------

  return (
    <div style={pageStyle}>
      {/* 顶部栏 */}
      <div style={topBarStyle}>
        <button type="button" style={btnSecondary} onClick={() => navigate('/')}>
          ← 返回列表
        </button>
        <button type="button" style={btnSecondary} onClick={handleClone}>
          复制副本
        </button>
      </div>

      {/* 名称 */}
      <input
        type="text"
        style={nameInputStyle}
        value={localName ?? wu.name}
        onChange={(e) => setLocalName(e.target.value)}
        onFocus={() => setLocalName(wu.name)}
        onBlur={handleNameBlur}
      />

      {/* 描述 */}
      <textarea
        style={descInputStyle}
        placeholder="添加描述…"
        value={localDesc ?? wu.description}
        onChange={(e) => setLocalDesc(e.target.value)}
        onFocus={() => setLocalDesc(wu.description)}
        onBlur={handleDescBlur}
        rows={2}
      />

      {/* 元信息 */}
      <div style={metaBarStyle}>
        <span style={tagStyle}>{wu.sourceType}</span>
        <span style={metaTextStyle}>创建于 {wu.createdAt.slice(0, 10)}</span>
      </div>

      {/* Slots 区域 */}
      <div style={sectionHeaderStyle}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Slots ({wu.slots.length})
        </span>
        <button type="button" style={btnPrimary} onClick={() => setShowAddSlot(true)}>
          + 添加 Slot
        </button>
      </div>

      {/* 添加 Slot 表单 */}
      {showAddSlot && (
        <div style={formCardStyle}>
          <input
            type="text"
            placeholder="Slot 名称"
            style={inputStyle}
            value={newSlotName}
            onChange={(e) => setNewSlotName(e.target.value)}
          />
          <select
            style={inputStyle}
            value={newSlotType}
            onChange={(e) => setNewSlotType(e.target.value as SlotType)}
          >
            {slotTypeOptions.map((t) => (
              <option key={t} value={t}>{slotTypeLabels[t]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="描述（可选）"
            style={inputStyle}
            value={newSlotDesc}
            onChange={(e) => setNewSlotDesc(e.target.value)}
          />
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={newSlotRequired}
              onChange={(e) => setNewSlotRequired(e.target.checked)}
            />
            必需
          </label>
          <div style={formActionsStyle}>
            <button type="button" style={btnPrimary} onClick={handleAddSlot}>确认添加</button>
            <button
              type="button"
              style={btnSecondary}
              onClick={() => {
                setShowAddSlot(false);
                setNewSlotName('');
                setNewSlotType('context');
                setNewSlotDesc('');
                setNewSlotRequired(false);
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 空提示 */}
      {wu.slots.length === 0 && (
        <p style={emptyHintStyle}>暂无 Slot，点击上方按钮添加。</p>
      )}

      {/* Slot 列表 */}
      {wu.slots.map((slot) => {
        const sortedCaps = [...slot.capabilities].sort((a, b) => a.order - b.order);
        return (
          <div key={slot.id} style={slotCardStyle}>
            {/* Slot 头部 */}
            <div style={slotHeaderStyle}>
              <span style={{ fontWeight: 600 }}>{slot.name}</span>
              <span style={tagStyle}>{slotTypeLabels[slot.slotType]}</span>
              {slot.required && <span style={requiredTagStyle}>必需</span>}
              {slot.fillIn && <span style={fillInTagStyle}>待补齐</span>}
              {slot.fillIn && <span style={fillInMethodTagStyle}>{slot.fillIn.method}</span>}
              <button
                type="button"
                style={btnDanger}
                aria-label={`删除 Slot ${slot.name}`}
                onClick={() => handleDeleteSlot(slot)}
              >
                ✕
              </button>
            </div>

            {/* Slot 描述 */}
            {slot.description && (
              <p style={slotDescStyle}>{slot.description}</p>
            )}

            {/* Capability 列表 */}
            {sortedCaps.map((cap, idx) => (
              <div key={cap.id} style={capRowStyle}>
                <span style={{ fontWeight: 500 }}>{cap.name}</span>
                <span style={capContentStyle}>{cap.content.slice(0, 60)}</span>
                <div style={capActionsStyle}>
                  <button
                    type="button"
                    style={btnSmall}
                    aria-label={`上移 ${cap.name}`}
                    disabled={idx === 0}
                    onClick={() => handleMoveCapability(slot, idx, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    style={btnSmall}
                    aria-label={`下移 ${cap.name}`}
                    disabled={idx === sortedCaps.length - 1}
                    onClick={() => handleMoveCapability(slot, idx, 'down')}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    style={btnDangerSmall}
                    aria-label={`删除 Capability ${cap.name}`}
                    onClick={() => handleDeleteCapability(slot.id, cap)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* 添加 Capability */}
            {addCapSlotId === slot.id ? (
              <div style={formCardInnerStyle}>
                <input
                  type="text"
                  placeholder="Capability 名称"
                  style={inputStyle}
                  value={newCapName}
                  onChange={(e) => setNewCapName(e.target.value)}
                />
                <textarea
                  placeholder="内容"
                  style={inputStyle}
                  value={newCapContent}
                  onChange={(e) => setNewCapContent(e.target.value)}
                  rows={2}
                />
                <div style={formActionsStyle}>
                  <button
                    type="button"
                    style={btnPrimary}
                    onClick={() => handleAddCapability(slot.id)}
                  >
                    确认添加 Capability
                  </button>
                  <button
                    type="button"
                    style={btnSecondary}
                    onClick={() => {
                      setAddCapSlotId(null);
                      setNewCapName('');
                      setNewCapContent('');
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                style={btnAddCap}
                onClick={() => {
                  setAddCapSlotId(slot.id);
                  setNewCapName('');
                  setNewCapContent('');
                }}
              >
                + 添加 Capability
              </button>
            )}
          </div>
        );
      })}

      {/* 约束区域 */}
      <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          约束 ({wu.constraints.length})
        </span>
        <button type="button" style={btnPrimary} onClick={() => setShowAddConstraint(true)}>
          + 添加约束
        </button>
      </div>

      {/* 添加约束表单 */}
      {showAddConstraint && (
        <div style={formCardStyle}>
          <input
            type="text"
            placeholder="约束名称"
            style={inputStyle}
            value={newConstraintName}
            onChange={(e) => setNewConstraintName(e.target.value)}
          />
          <select
            style={inputStyle}
            value={newConstraintType}
            onChange={(e) => setNewConstraintType(e.target.value as ConstraintType)}
          >
            {constraintTypeOptions.map((t) => (
              <option key={t} value={t}>{constraintTypeLabels[t]}</option>
            ))}
          </select>
          <textarea
            placeholder="约束内容"
            style={inputStyle}
            value={newConstraintContent}
            onChange={(e) => setNewConstraintContent(e.target.value)}
            rows={2}
          />
          <div style={formActionsStyle}>
            <button type="button" style={btnPrimary} onClick={handleAddConstraint}>确认添加约束</button>
            <button type="button" style={btnSecondary} onClick={() => {
              setShowAddConstraint(false);
              setNewConstraintName('');
              setNewConstraintType('output');
              setNewConstraintContent('');
            }}>取消</button>
          </div>
        </div>
      )}

      {/* 约束空提示 */}
      {wu.constraints.length === 0 && !showAddConstraint && (
        <p style={emptyHintStyle}>暂无约束，点击上方按钮添加。</p>
      )}

      {/* 约束列表 */}
      {[...wu.constraints].sort((a, b) => a.order - b.order).map((cp, cpIdx) => (
        <div key={cp.id} style={slotCardStyle}>
          <div style={slotHeaderStyle}>
            <span style={{ fontWeight: 600 }}>{cp.name}</span>
            <span style={tagStyle}>{constraintTypeLabels[cp.constraintType]}</span>
            <div style={{ ...capActionsStyle, marginLeft: 'auto' }}>
              <button
                type="button"
                style={btnSmall}
                aria-label={`上移约束 ${cp.name}`}
                disabled={cpIdx === 0}
                onClick={() => handleMoveConstraint(cpIdx, 'up')}
              >
                ↑
              </button>
              <button
                type="button"
                style={btnSmall}
                aria-label={`下移约束 ${cp.name}`}
                disabled={cpIdx === wu.constraints.length - 1}
                onClick={() => handleMoveConstraint(cpIdx, 'down')}
              >
                ↓
              </button>
              <button
                type="button"
                style={btnDangerSmall}
                aria-label={`删除约束 ${cp.name}`}
                onClick={() => handleDeleteConstraint(cp)}
              >
                ✕
              </button>
            </div>
          </div>
          <p style={slotDescStyle}>{cp.content}</p>
        </div>
      ))}

      {/* 待补齐摘要 */}
      {(() => {
        const fillInSlots = wu.slots.filter((s) => s.fillIn);
        if (fillInSlots.length === 0) return null;

        const byMethod: Record<string, typeof fillInSlots> = {};
        for (const s of fillInSlots) {
          const m = s.fillIn!.method;
          if (!byMethod[m]) byMethod[m] = [];
          byMethod[m].push(s);
        }

        return (
          <>
            <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                待补齐项 ({fillInSlots.length})
              </span>
            </div>
            <div style={summaryCardStyle}>
              <div style={summaryHeaderStyle}>待补齐摘要</div>
              {fillInMethodOptions.map((method) => {
                const slots = byMethod[method];
                if (!slots || slots.length === 0) return null;
                return (
                  <div key={method} style={summaryItemStyle}>
                    <span style={fillInMethodTagStyle}>{fillInMethodLabels[method]}</span>
                    {' '}({slots.length}): {slots.map((s) => s.name).join('、')}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* 预览与交接 */}
      <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>预览与交接</span>
        <span style={handoffStatusStyles[handoffStatus]}>{handoffStatusLabels[handoffStatus]}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button type="button" style={btnPrimary} onClick={handleGeneratePreview}>
          生成预览
        </button>
        <button type="button" style={btnSecondary} onClick={handleCopy} disabled={!previewText || !hasContent}>
          {copyFeedback ? '已复制 ✓' : '复制'}
        </button>
        <button type="button" style={btnSecondary} onClick={handleDownload} disabled={!previewText || !hasContent}>
          下载 .txt
        </button>
      </div>

      {!hasContent && (
        <p style={emptyHintStyle}>内容为空，请先添加 Slot 和 Capability。</p>
      )}

      {previewText !== null && (
        <pre style={previewBoxStyle}>{previewText || '（无内容）'}</pre>
      )}

      {/* 版本历史 */}
      <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          版本历史 ({snapshots.length})
        </span>
        <button type="button" style={btnPrimary} onClick={handleCreateSnapshot}>
          创建快照
        </button>
      </div>

      {snapshotsLoaded && snapshots.length === 0 && (
        <p style={emptyHintStyle}>暂无版本快照</p>
      )}

      {snapshots.map((snap) => (
        <div key={snap.id} style={versionRowStyle}>
          <span style={{ fontWeight: 600 }}>v{snap.versionNumber}</span>
          <span style={metaTextStyle}>{snap.createdAt.slice(0, 19).replace('T', ' ')}</span>
          <span style={tagStyle}>{snap.contentHash}</span>
          <button
            type="button"
            style={btnSecondary}
            onClick={() => handleRestoreSnapshot(snap.id, snap.versionNumber)}
          >
            恢复
          </button>
        </div>
      ))}
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

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const btnSecondary: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  background: '#edf2f7',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: '#4a5568',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  background: '#4299e1',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const btnDanger: React.CSSProperties = {
  padding: '0.2rem 0.5rem',
  background: '#fed7d7',
  color: '#c53030',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  marginLeft: 'auto',
};

const btnDangerSmall: React.CSSProperties = {
  padding: '0.1rem 0.4rem',
  background: '#fed7d7',
  color: '#c53030',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem',
};

const btnSmall: React.CSSProperties = {
  padding: '0.1rem 0.4rem',
  background: '#edf2f7',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.75rem',
  color: '#4a5568',
};

const btnAddCap: React.CSSProperties = {
  padding: '0.3rem 0.6rem',
  background: 'transparent',
  border: '1px dashed #cbd5e0',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  color: '#718096',
  marginTop: '0.5rem',
  width: '100%',
};

const nameInputStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1a202c',
  border: 'none',
  borderBottom: '2px solid transparent',
  outline: 'none',
  width: '100%',
  padding: '0.3rem 0',
  marginBottom: '0.5rem',
  background: 'transparent',
};

const descInputStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#4a5568',
  border: 'none',
  outline: 'none',
  width: '100%',
  padding: '0.3rem 0',
  marginBottom: '0.5rem',
  background: 'transparent',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const metaBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  marginBottom: '1.5rem',
  fontSize: '0.8rem',
};

const metaTextStyle: React.CSSProperties = {
  color: '#a0aec0',
};

const tagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#edf2f7',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#4a5568',
};

const requiredTagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#fefcbf',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#975a16',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
};

const formCardStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#f7fafc',
  borderRadius: '8px',
  marginBottom: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const formCardInnerStyle: React.CSSProperties = {
  padding: '0.75rem',
  background: '#f7fafc',
  borderRadius: '6px',
  marginTop: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '0.25rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.6rem',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.85rem',
  color: '#4a5568',
};

const emptyHintStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#f7fafc',
  borderRadius: '8px',
  color: '#a0aec0',
  textAlign: 'center',
  fontSize: '0.9rem',
};

const slotCardStyle: React.CSSProperties = {
  padding: '1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  marginBottom: '0.75rem',
};

const slotHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const slotDescStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#718096',
  margin: '0 0 0.5rem',
};

const capRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.4rem 0.5rem',
  background: '#f7fafc',
  borderRadius: '4px',
  marginBottom: '0.3rem',
  fontSize: '0.85rem',
};

const capContentStyle: React.CSSProperties = {
  flex: 1,
  color: '#718096',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const capActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.25rem',
  flexShrink: 0,
};

const fillInTagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#bee3f8',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#2b6cb0',
};

const fillInMethodTagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#e9d8fd',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#6b46c1',
};

const summaryCardStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#ebf8ff',
  borderRadius: '8px',
  marginBottom: '0.75rem',
  border: '1px solid #bee3f8',
};

const summaryHeaderStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  marginBottom: '0.5rem',
  color: '#2b6cb0',
};

const summaryItemStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#4a5568',
  padding: '0.2rem 0',
};

const previewBoxStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#1a202c',
  color: '#e2e8f0',
  borderRadius: '8px',
  fontSize: '0.85rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflow: 'auto',
  maxHeight: '400px',
  fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
};

const versionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
};
