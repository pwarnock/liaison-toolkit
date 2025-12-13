/**
 * Markdown Tasklist Parser
 * Parse and stringify Cody version tasklists (markdown tables)
 */

import type { TasklistRow, VersionMetadata } from './types';

export class TasklistParser {
  parse(content: string): TasklistRow[] {
    const lines = content.split('\n');
    const rows: TasklistRow[] = [];

    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and headers
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) continue;

      // Detect table header separator (|---|---|...)
      if (trimmed.includes('---')) {
        inTable = true;
        continue;
      }

      // Only process lines that look like table rows
      if (!inTable || !trimmed.startsWith('|')) continue;

      const parsed = this.parseRow(trimmed);
      if (parsed) {
        rows.push(parsed);
      }
    }

    return rows;
  }

  parseRow(tableRow: string): TasklistRow | null {
    // Remove leading/trailing pipes and split by pipe
    const cells = tableRow
      .split('|')
      .slice(1, -1) // Remove empty strings from leading/trailing pipes
      .map((cell) => cell.trim());

    if (cells.length < 2) return null;

    // Map columns: ID | Task | Description | Dependencies | Status | Assigned To
    const [id, task, description, dependencies, status, assignedTo] = cells;

    if (!task) return null;

    return {
      id: this.parseId(id),
      task: this.stripMarkdown(task),
      description: description ? this.stripMarkdown(description) : undefined,
      dependencies: dependencies ? this.stripMarkdown(dependencies) : undefined,
      status: this.parseStatus(status),
      assignedTo: assignedTo ? this.stripMarkdown(assignedTo) : undefined,
    };
  }

  stringify(rows: TasklistRow[], metadata?: VersionMetadata): string {
    const lines: string[] = [];

    if (metadata?.version) {
      lines.push(`# ${metadata.version} Tasklist\n`);
    }

    if (metadata?.description) {
      lines.push(`${metadata.description}\n`);
    }

    // Header
    lines.push(
      '| ID | Task | Description | Dependencies | Status | Assigned To |'
    );
    lines.push('|---|---|---|---|---|---|');

    // Rows
    for (const row of rows) {
      lines.push(this.stringifyRow(row));
    }

    return lines.join('\n');
  }

  stringifyRow(row: TasklistRow): string {
    const id = row.id || '-';
    const task = row.task;
    const description = row.description || '-';
    const dependencies = row.dependencies || '-';
    const status = this.statusEmoji(row.status);
    const assignedTo = row.assignedTo || '-';

    return `| ${id} | ${task} | ${description} | ${dependencies} | ${status} | ${assignedTo} |`;
  }

  markRowDeleted(row: TasklistRow): TasklistRow {
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

  markRowDone(row: TasklistRow): TasklistRow {
    return { ...row, status: 'done' };
  }

  insertId(row: TasklistRow, id: string): TasklistRow {
    return { ...row, id };
  }

  isMarkedDeleted(row: TasklistRow): boolean {
    return (
      (row.id && row.id.includes('~~')) ||
      row.task.includes('~~') ||
      row.status === 'deleted'
    );
  }

  private parseId(value: string): string | null {
    const stripped = this.stripMarkdown(value);
    return stripped === '-' ? null : stripped || null;
  }

  private parseStatus(value: string | undefined): 'todo' | 'done' | 'deleted' {
    if (!value) return 'todo';
    const stripped = this.stripMarkdown(value).toLowerCase();
    if (
      stripped.includes('done') ||
      stripped.includes('🟢') ||
      stripped.includes('✓')
    ) {
      return 'done';
    }
    if (stripped.includes('delete') || stripped.includes('~~')) {
      return 'deleted';
    }
    return 'todo';
  }

  private statusEmoji(status: 'todo' | 'done' | 'deleted'): string {
    switch (status) {
      case 'done':
        return '🟢';
      case 'deleted':
        return '❌';
      default:
        return '🔴';
    }
  }

  private stripMarkdown(value: string): string {
    // Remove strikethrough markup
    return value
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
  }
}
