/**
 * Tasklist Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { TasklistParser } from './tasklist-parser';

describe('TasklistParser', () => {
  const parser = new TasklistParser();

  describe('parse', () => {
    it('parses basic markdown table', () => {
      const content = `# v0.1.0 Tasklist

| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| abc-001 | Auth module | Implement JWT | - | 🟢 | AGENT |
| | Database setup | Create schema | - | 🔴 | HUMAN |
`;

      const rows = parser.parse(content);
      expect(rows).toHaveLength(2);
      expect(rows[0].id).toBe('abc-001');
      expect(rows[0].task).toBe('Auth module');
      expect(rows[0].status).toBe('done');
      expect(rows[1].id).toBeNull();
      expect(rows[1].status).toBe('todo');
    });

    it('parses strikethrough rows', () => {
      const content = `| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| ~~abc-001~~ | ~~Deleted task~~ | ~~...~~ | ~~...~~ | ❌ | ~~AGENT~~ |
`;

      const rows = parser.parse(content);
      expect(rows).toHaveLength(1);
      expect(rows[0].task).toBe('Deleted task'); // Strikethrough is stripped in parsing
      // Row is detected as marked deleted because the raw ID contains ~~
    });

    it('ignores non-table content', () => {
      const content = `# Heading
Some paragraph text
Another line

| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| abc-001 | Task | Desc | - | 🟢 | AGENT |

More text after table`;

      const rows = parser.parse(content);
      expect(rows).toHaveLength(1);
    });
  });

  describe('stringify', () => {
    it('converts rows back to markdown', () => {
      const rows = [
        {
          id: 'abc-001',
          task: 'Auth module',
          description: 'Implement JWT',
          dependencies: '-',
          status: 'done' as const,
          assignedTo: 'AGENT',
        },
      ];

      const markdown = parser.stringify(rows, { version: 'v0.1.0-initial' });
      expect(markdown).toContain('# v0.1.0-initial Tasklist');
      expect(markdown).toContain('| abc-001 |');
      expect(markdown).toContain('| Auth module |');
      expect(markdown).toContain('🟢');
    });

    it('round-trip: parse -> stringify -> parse', () => {
      const original = `| ID | Task | Description | Dependencies | Status | Assigned To |
|---|---|---|---|---|---|
| abc-001 | Auth | JWT impl | - | 🟢 | AGENT |
| | DB setup | Schema | - | 🔴 | HUMAN |
`;

      const rows = parser.parse(original);
      const markdown = parser.stringify(rows);
      const reparsed = parser.parse(markdown);

      expect(reparsed).toHaveLength(rows.length);
      expect(reparsed[0].id).toBe(rows[0].id);
      expect(reparsed[0].task).toBe(rows[0].task);
      expect(reparsed[1].id).toBe(rows[1].id);
    });
  });

  describe('markRowDeleted', () => {
    it('applies strikethrough to all cells', () => {
      const row = {
        id: 'abc-001',
        task: 'Task',
        description: 'Desc',
        dependencies: '-',
        status: 'todo' as const,
        assignedTo: 'AGENT',
      };

      const deleted = parser.markRowDeleted(row);

      expect(deleted.id).toContain('~~');
      expect(deleted.task).toContain('~~');
      expect(deleted.description).toContain('~~');
      expect(deleted.status).toBe('deleted');
    });

    it('handles missing optional fields', () => {
      const row = {
        id: 'abc-001',
        task: 'Task',
        description: undefined,
        dependencies: undefined,
        status: 'todo' as const,
        assignedTo: undefined,
      };

      const deleted = parser.markRowDeleted(row);

      expect(deleted.description).toBeUndefined();
      expect(deleted.dependencies).toBeUndefined();
      expect(deleted.assignedTo).toBeUndefined();
    });
  });

  describe('markRowDone', () => {
    it('changes status to done', () => {
      const row = {
        id: 'abc-001',
        task: 'Task',
        status: 'todo' as const,
      };

      const done = parser.markRowDone(row);

      expect(done.status).toBe('done');
      expect(done.task).toBe(row.task); // Other fields unchanged
    });
  });

  describe('insertId', () => {
    it('inserts task ID into row', () => {
      const row = {
        id: null,
        task: 'Task',
        status: 'todo' as const,
      };

      const withId = parser.insertId(row, 'abc-001');

      expect(withId.id).toBe('abc-001');
      expect(withId.task).toBe(row.task);
    });
  });

  describe('isMarkedDeleted', () => {
    it('detects strikethrough in ID', () => {
      const row = {
        id: '~~abc-001~~',
        task: 'Task',
        status: 'todo' as const,
      };

      expect(parser.isMarkedDeleted(row)).toBe(true);
    });

    it('detects strikethrough in task', () => {
      const row = {
        id: 'abc-001',
        task: '~~Task~~',
        status: 'todo' as const,
      };

      expect(parser.isMarkedDeleted(row)).toBe(true);
    });

    it('detects deleted status', () => {
      const row = {
        id: 'abc-001',
        task: 'Task',
        status: 'deleted' as const,
      };

      expect(parser.isMarkedDeleted(row)).toBe(true);
    });

    it('returns false for normal rows', () => {
      const row = {
        id: 'abc-001',
        task: 'Task',
        status: 'todo' as const,
      };

      expect(parser.isMarkedDeleted(row)).toBe(false);
    });
  });
});
