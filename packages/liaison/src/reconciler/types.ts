/**
 * Reconciler type definitions
 * Shared types for task backend adapter, version tasklists, and reconciliation results
 */

export enum TaskStatus {
  Open = 'open',
  Closed = 'closed',
  Deleted = 'deleted',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  closedAt?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TasklistRow {
  id: string | null;
  task: string;
  description?: string;
  dependencies?: string;
  status: 'todo' | 'done' | 'deleted';
  assignedTo?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  assignedTo?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VersionConfig {
  path: string;
  version: string;
  tasklistPath: string;
  exists: boolean;
}

export interface RowChange {
  rowIndex: number;
  changeType: 'created-id' | 'marked-done' | 'marked-deleted' | 'no-change';
  oldRow: TasklistRow;
  newRow: TasklistRow;
}

export interface ReconcileResult {
  version: string;
  originalRows: TasklistRow[];
  newRows: TasklistRow[];
  changes: RowChange[];
  created: number;
  updated: number;
  deleted: number;
  dryRun: boolean;
}

export interface VersionMetadata {
  version: string;
  description?: string;
  createdAt?: Date;
}
