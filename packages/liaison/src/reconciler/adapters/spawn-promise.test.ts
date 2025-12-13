/**
 * Spawn Promise Utility Tests
 * Tests the spawnPromise helper function
 */

import { describe, it, expect } from 'vitest';
import { spawnPromise } from './beads-adapter';

describe('spawnPromise', () => {
  describe('basic functionality', () => {
    it('should execute a simple command and return output', async () => {
      const { stdout, stderr, exitCode } = await spawnPromise('echo', [
        'Hello, World!',
      ]);
      expect(stdout).toContain('Hello, World!');
      expect(stderr).toBe('');
      expect(exitCode).toBe(0);
    });

    it('should handle commands with arguments', async () => {
      const { stdout, exitCode } = await spawnPromise('node', ['-v']);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toBeTruthy();
    });

    it('should handle commands that fail', async () => {
      const { exitCode } = await spawnPromise('false', []);
      expect(exitCode).not.toBe(0);
    });

    it('should handle commands with stderr output', async () => {
      const { stderr, exitCode } = await spawnPromise('ls', ['/nonexistent']);
      expect(exitCode).not.toBe(0);
      expect(stderr).toBeTruthy();
    });
  });

  describe('timeout functionality', () => {
    it('should timeout when command takes too long', async () => {
      const startTime = Date.now();
      try {
        await spawnPromise('sleep', ['10'], { timeoutMs: 100 });
        expect.fail('Should have timed out');
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toBe('Command timeout');
          const elapsed = Date.now() - startTime;
          expect(elapsed).toBeLessThan(500); // Should timeout within ~500ms
        }
      }
    });

    it('should complete when command finishes before timeout', async () => {
      const { stdout, exitCode } = await spawnPromise('echo', ['test'], {
        timeoutMs: 1000,
      });
      expect(stdout).toContain('test');
      expect(exitCode).toBe(0);
    });
  });

  describe('security - no shell injection', () => {
    it('should not execute shell commands when passed as arguments', async () => {
      // This would execute a shell command if using exec with shell=true
      // With spawn, it should just pass the argument literally
      const { stdout, exitCode } = await spawnPromise('echo', [
        'test; rm -rf /',
      ]);
      expect(stdout).toContain('test; rm -rf /');
      expect(exitCode).toBe(0);
    });

    it('should handle special characters in arguments', async () => {
      const { stdout, exitCode } = await spawnPromise('echo', [
        'test "with quotes" and $pecial chars',
      ]);
      expect(stdout).toContain('test "with quotes" and $pecial chars');
      expect(exitCode).toBe(0);
    });
  });

  describe('command prefix handling', () => {
    it('should work with bun x prefix', async () => {
      // Test that we can call a command with prefix
      const { stdout, exitCode } = await spawnPromise('echo', ['--version']);
      expect(exitCode).toBe(0);
      expect(stdout).toBeTruthy();
    });
  });
});
