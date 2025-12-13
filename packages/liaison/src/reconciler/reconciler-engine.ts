/**
 * Reconciliation Engine
 * Core algorithm for reconciling version tasklists with task backend
 */

import type { TasklistRow, ReconcileResult, RowChange } from './types';
import type { TaskBackendAdapter } from './adapter';
import { TaskStatus as TS } from './types';

export class ReconcilerEngine {
  constructor(private adapter: TaskBackendAdapter) {}

  async reconcile(
    rows: TasklistRow[],
    versionName: string,
    dryRun: boolean = false
  ): Promise<ReconcileResult> {
    const changes: RowChange[] = [];
    const newRows: TasklistRow[] = [];
    let created = 0;
    let updated = 0;
    let deleted = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let newRow = { ...row };
      let changeType: RowChange['changeType'] = 'no-change';

      // If already marked deleted, skip
      if (this.isMarkedDeleted(row)) {
        changeType = 'no-change';
      }
      // If no ID, create task in backend
      else if (!row.id) {
        if (!dryRun) {
          try {
            const task = await this.adapter.createTask({
              title: row.task,
              description: row.description,
              assignedTo: row.assignedTo,
            });
            newRow = { ...row, id: task.id };
            changeType = 'created-id';
            created++;
          } catch (err) {
            console.error(`Failed to create task for row ${i}: ${err}`);
          }
        } else {
          // Dry run: simulate creation without actual backend call
          newRow = { ...row, id: `dry-run-simulated-id-${i}` };
          changeType = 'created-id';
          created++;
        }
      }
      // If has ID, sync status
      else {
        if (!dryRun) {
          const task = await this.adapter.getTask(row.id);

          if (!task || task.status === TS.Deleted) {
            // Task deleted in backend: mark row deleted
            newRow = this.markRowDeleted(row);
            changeType = 'marked-deleted';
            deleted++;
          } else if (task.status === TS.Closed && row.status !== 'done') {
            // Task closed: mark row done
            newRow = { ...row, status: 'done' };
            changeType = 'marked-done';
            updated++;
          }
        } else {
          // Dry run: simulate status sync without actual backend calls
          // Simulate some changes for demonstration
          if (row.status !== 'done' && Math.random() > 0.5) {
            newRow = { ...row, status: 'done' };
            changeType = 'marked-done';
            updated++;
          }
        }
      }

      newRows.push(newRow);

      if (changeType !== 'no-change') {
        changes.push({
          rowIndex: i,
          changeType,
          oldRow: row,
          newRow,
        });
      }
    }

    return {
      version: versionName,
      originalRows: rows,
      newRows,
      changes,
      created,
      updated,
      deleted,
      dryRun,
    };
  }

  private isMarkedDeleted(row: TasklistRow): boolean {
    return (
      (row.id && row.id.includes('~~')) ||
      row.task.includes('~~') ||
      row.status === 'deleted'
    );
  }

  private markRowDeleted(row: TasklistRow): TasklistRow {
    return {
      ...row,
      id: row.id ? `~~${row.id}~~` : null,
      task: `~~${row.task}~~`,
      description: row.description ? `~~${row.description}~~` : undefined,
      dependencies: row.dependencies ? `~~${row.dependencies}~~` : undefined,
      status: 'deleted',
      assignedTo: row.assignedTo ? `~~${row.assignedTo}~~` : undefined,
    };
  }
}
