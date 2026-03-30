/**
 * WorkUnit 共享对象身份、版本与谱系引用语义
 *
 * B0.1 Story: 为 Qomo 2.x 建立跨工作面复用的统一身份 contract。
 *
 * 本文件只定义 shared frontend contract，不涉及：
 * - backend schema / OpenAPI / endpoint / DB / infra
 * - runtime capability discovery（归 VS Code）
 * - launch decision / handoff payload
 *
 * 三层身份语义：
 * 1. 逻辑身份（WorkUnitIdentity）— 长期不变的稳定 ID
 * 2. 快照/版本身份（SnapshotIdentity）— 某次可启动的具体 revision
 * 3. 谱系引用（LineageReference）— 父版本、复制来源追溯
 *
 * 后续 W4 / V1 / O1 必须复用本文件的类型，不得各自重复定义。
 *
 * === B0.1 实现边界声明 ===
 * 本故事只定义 shared identity / version / lineage contract。
 * 以下职责明确不在本文件范围内：
 * - CapabilityAvailability（runtime discovery，归 VS Code）
 * - LaunchDecision / HandoffPayload（runtime 决策与交付）
 * - Slot / Capability 完整结构（归后续 W2a / W2b / W2c）
 * - backend schema / OpenAPI / endpoint / DB / infra
 * - 最终事实源策略的工程实现细节
 */

// ---------------------------------------------------------------------------
// Enums & Literal Unions
// ---------------------------------------------------------------------------

/** 对象的来源类型 */
export type SourceType = 'created_new' | 'cloned_from' | 'restored_from';

/** 谱系路径中的操作类型 */
export type LineageAction = 'created' | 'cloned' | 'restored';

// ---------------------------------------------------------------------------
// ISO 8601 时间戳类型别名
// ---------------------------------------------------------------------------

/** ISO 8601 格式的时间戳字符串，例如 "2026-03-30T10:00:00Z" */
export type ISO8601 = string;

// ---------------------------------------------------------------------------
// 1. 逻辑身份 — 长期不变的稳定 Work Unit 标识
// ---------------------------------------------------------------------------

/**
 * 逻辑身份：同一个 Work Unit 在长期演进中的稳定 identity。
 * 不管编辑多少次、生成多少个版本，workUnitId 始终不变。
 */
export interface WorkUnitIdentity {
  /** 稳定的逻辑主键（UUID 或 nanoid），跨所有版本不变 */
  readonly workUnitId: string;

  /** 用户可见的显示名称 */
  name: string;

  /** 可选的描述信息 */
  description?: string;

  /** 首次创建时间 */
  readonly createdAt: ISO8601;
}

// ---------------------------------------------------------------------------
// 2. 快照/版本身份 — 某次可启动的具体 revision
// ---------------------------------------------------------------------------

/**
 * 快照身份：某个可启动、可回看的 immutable 版本。
 * VS Code 拉取的是特定 snapshot version。
 */
export interface SnapshotIdentity {
  /**
   * 快照唯一 ID，格式: `{workUnitId}#v{versionNumber}`
   * 一旦创建不可修改。
   */
  readonly snapshotId: string;

  /** 版本唯一标识（内部 ID） */
  readonly versionId: string;

  /** 语义化版本号，例如 "1.0.0" */
  readonly versionNumber: string;

  /** 快照创建时间 */
  readonly createdAt: ISO8601;

  /**
   * 序列化内容的 SHA-256 哈希，用于变更检测。
   * 格式: "sha256_{hash}"
   */
  readonly contentHash: string;

  /**
   * 前一个版本的 versionId，用于构建版本链。
   * 首个版本为 null。
   */
  readonly previousVersionId: string | null;

  /** 可选的版本标签，例如 "stable", "latest" */
  versionTag?: string;
}

// ---------------------------------------------------------------------------
// 3. 谱系引用 — 父版本、复制来源追溯
// ---------------------------------------------------------------------------

/**
 * 谱系路径中的单条记录。
 * 描述一个 Work Unit 在某个时间点的操作。
 */
export interface LineageEntry {
  /** 相关的 Work Unit ID */
  readonly workUnitId: string;

  /** 该时刻的版本号 */
  readonly versionNumber: string;

  /** 操作类型 */
  readonly action: LineageAction;

  /** 操作时间 */
  readonly timestamp: ISO8601;
}

/**
 * 谱系引用：完整描述一个 Work Unit 的来源与继承关系。
 *
 * 三种来源场景：
 * - created_new: 全新创建，无来源
 * - cloned_from: 从另一个 Work Unit 复制
 * - restored_from: 从历史版本恢复
 */
export interface LineageReference {
  /** 来源类型 */
  readonly sourceType: SourceType;

  /**
   * 复制/恢复来源的 Work Unit ID。
   * cloned_from / restored_from 场景有值，created_new 时为 null。
   */
  readonly sourceWorkUnitId: string | null;

  /**
   * 完整祖先链，从最早到最近排列。
   * 全新创建时为空数组。
   */
  readonly lineagePath: readonly LineageEntry[];
}

// ---------------------------------------------------------------------------
// 组合类型 — WorkUnitSnapshot
// ---------------------------------------------------------------------------

/**
 * WorkUnitSnapshot: 组合三层身份语义的核心复合类型。
 *
 * 这是后续 W4 / V1 / O1 等 Story 共同依赖的基础 contract。
 * 所有工作面（Web / VS Code / observation）消费同一结构。
 */
export interface WorkUnitSnapshot {
  /** 逻辑身份：长期不变的 Work Unit 标识 */
  readonly identity: WorkUnitIdentity;

  /** 快照身份：当前 revision 的版本信息 */
  readonly snapshot: SnapshotIdentity;

  /** 谱系引用：来源与继承追溯 */
  readonly lineage: LineageReference;
}

// ---------------------------------------------------------------------------
// 构建参数
// ---------------------------------------------------------------------------

/** buildWorkUnitSnapshot 的参数 */
export interface BuildSnapshotParams {
  name: string;
  description?: string;
  contentHash: string;
  /** 初始版本号，默认 '1.0.0' */
  initialVersion?: string;
}
