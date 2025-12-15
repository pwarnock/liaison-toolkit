#!/usr/bin/env bun
/**
 * Modern Bun-based Automated Beads-Cody Sync System
 * Replaces the old Python version with faster, more reliable Bun implementation
 * Avoids all Bun compatibility issues with process.exit()
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration
const PROJECT_ROOT: string = '.';
const BEADS_FILE: string = join(PROJECT_ROOT, ".beads", "issues.jsonl");
const CODY_BACKLOG: string = join(PROJECT_ROOT, ".cody", "project", "build", "feature-backlog.md");
const STATE_FILE: string = join(PROJECT_ROOT, ".beads-cody-sync-state.json");
const LOG_FILE: string = join(PROJECT_ROOT, ".beads-cody-sync.log");

interface SyncState {
  last_sync: string | null;
  beads_hash: string;
  cody_hash: string;
  last_sync_commit: string;
  conflicts_resolved: string[];
}

interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

function log(message: string, level: "info" | "error" | "warn" = "info"): void {
  const timestamp: string = new Date().toISOString();
  const logMessage: string = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  console[level](logMessage);
  try {
    writeFileSync(LOG_FILE, logMessage, { flag: "a" });
  } catch (error: unknown) {
    console.error("Failed to write to log file:", error);
  }
}

async function runCommand(command: string, args: string[] = []): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(`${command} ${args.join(" ")}`);
    return {
      success: true,
      output: stdout,
      error: stderr
    };
  } catch (error: unknown) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function getFileHash(filePath: string): string {
  if (!existsSync(filePath)) return "";

  try {
    const content = readFileSync(filePath);
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error: unknown) {
    log(`Failed to hash ${filePath}: ${error}`, "error");
    return "";
  }
}

function loadState(): SyncState {
  if (!existsSync(STATE_FILE)) {
    return {
      last_sync: null,
      beads_hash: "",
      cody_hash: "",
      last_sync_commit: "",
      conflicts_resolved: [],
    };
  }

  try {
    const content: string = readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(content) as SyncState;
  } catch (error: unknown) {
    log(`Failed to load state: ${error}`, "error");
    return {
      last_sync: null,
      beads_hash: "",
      cody_hash: "",
      last_sync_commit: "",
      conflicts_resolved: [],
    };
  }
}

function saveState(state: SyncState): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error: unknown) {
    log(`Failed to save state: ${error}`, "error");
  }
}

function detectChanges(): { beadsChanged: boolean; codyChanged: boolean } {
  const state: SyncState = loadState();
  const currentBeadsHash: string = getFileHash(BEADS_FILE);
  const currentCodyHash: string = getFileHash(CODY_BACKLOG);

  const beadsChanged: boolean = currentBeadsHash !== state.beads_hash;
  const codyChanged: boolean = currentCodyHash !== state.cody_hash;

  log(`Change detection: Beads=${beadsChanged}, Cody=${codyChanged}`);
  return { beadsChanged, codyChanged };
}

async function validateSyncPreconditions(): Promise<{ valid: boolean; message: string }> {
  // Check if we're in a git repo
  const gitCheck: CommandResult = await runCommand("git", ["rev-parse", "--git-dir"]);
  if (!gitCheck.success) {
    return { valid: false, message: "Not in a git repository" };
  }

  // Check if there are uncommitted changes
  const statusCheck: CommandResult = await runCommand("git", ["status", "--porcelain"]);
  if (statusCheck.output.trim()) {
    return { valid: false, message: "Uncommitted changes detected" };
  }

  return { valid: true, message: "Validation passed" };
}

async function runSyncWithRollback(): Promise<{ success: boolean; message: string }> {
  // Get current commit for rollback
  const commitCheck: CommandResult = await runCommand("git", ["rev-parse", "HEAD"]);
  if (!commitCheck.success) {
    return { success: false, message: `Failed to get current commit: ${commitCheck.error}` };
  }

  const currentCommit: string = commitCheck.output.trim();
  const backupState: SyncState = loadState();
  const backupFiles: Record<string, string> = {};

  // Backup critical files
  for (const filePath of [CODY_BACKLOG]) {
    if (existsSync(filePath)) {
      backupFiles[filePath] = readFileSync(filePath, "utf-8");
    }
  }

  try {
    // Run the actual sync using Bun
    const result: CommandResult = await runCommand("bun", [
      "run",
      "scripts/beads-cody-sync.ts",
      "--command=sync",
      "--verbose"
    ]);

    if (!result.success) {
      throw new Error(`Sync failed: ${result.error}`);
    }

    // Validate sync results
    const validation: { valid: boolean; message: string } = validateSyncResults();
    if (!validation.valid) {
      throw new Error(`Sync validation failed: ${validation.message}`);
    }

    return { success: true, message: "Sync completed successfully" };

  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    log(`Sync failed, attempting rollback: ${errorMessage}`, "error");

    // Rollback file changes
    for (const [filePath, content] of Object.entries(backupFiles)) {
      try {
        writeFileSync(filePath, content);
      } catch (rollbackError: unknown) {
        log(`Failed to rollback ${filePath}: ${rollbackError}`, "error");
      }
    }

    // Rollback state
    saveState(backupState);

    return { success: false, message: `Sync failed and rolled back: ${errorMessage}` };
  }
}

function validateSyncResults(): { valid: boolean; message: string } {
  // Check that Cody files exist and are not empty
  if (!existsSync(CODY_BACKLOG)) {
    return { valid: false, message: "Cody feature-backlog.md not created" };
  }

  const stats: number = existsSync(CODY_BACKLOG) ? readFileSync(CODY_BACKLOG).length : 0;
  if (stats === 0) {
    return { valid: false, message: "Cody feature-backlog.md is empty" };
  }

  // Check that the file contains expected structure
  const content: string = readFileSync(CODY_BACKLOG, "utf-8");
  if (!content.includes("## Backlog") || !content.includes("|")) {
    return { valid: false, message: "Cody feature-backlog.md appears malformed" };
  }

  // Validate that Beads file is still valid JSONL
  try {
    if (existsSync(BEADS_FILE)) {
      const lines: string[] = readFileSync(BEADS_FILE, "utf-8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line: string = lines[i].trim();
        if (line) {
          JSON.parse(line);
        }
      }
    }
  } catch (error: unknown) {
    return { valid: false, message: `Beads file validation failed: ${error}` };
  }

  return { valid: true, message: "Validation passed" };
}

async function autoCommitSyncChanges(message: string): Promise<boolean> {
  try {
    // Check what changed
    const statusCheck: CommandResult = await runCommand("git", ["status", "--porcelain"]);
    if (!statusCheck.output.trim()) {
      log("No changes to commit");
      return true;
    }

    // Add only sync-related files
    const syncFiles: string[] = [
      CODY_BACKLOG,
      STATE_FILE
    ];

    for (const syncFile of syncFiles) {
      if (existsSync(syncFile)) {
        await runCommand("git", ["add", syncFile]);
      }
    }

    // Commit with standardized message
    await runCommand("git", ["commit", "-m", `auto-sync: ${message}`]);

    log(`Auto-committed sync changes: ${message}`);
    return true;

  } catch (error: unknown) {
    log(`Failed to auto-commit sync changes: ${error}`, "error");
    return false;
  }
}

async function runAutomatedSync(trigger: string = "auto"): Promise<{ success: boolean; message: string }> {
  log(`Starting automated sync (trigger: ${trigger})`);

  try {
    // Validate preconditions
    const validation: { valid: boolean; message: string } = await validateSyncPreconditions();
    if (!validation.valid) {
      return { success: false, message: `Preconditions failed: ${validation.message}` };
    }

    // Check if sync is needed
    const { beadsChanged, codyChanged }: { beadsChanged: boolean; codyChanged: boolean } = detectChanges();
    if (!beadsChanged && !codyChanged) {
      log("No changes detected, skipping sync");
      return { success: true, message: "No sync needed" };
    }

    // Run sync with rollback
    const syncResult: { success: boolean; message: string } = await runSyncWithRollback();
    if (!syncResult.success) {
      return syncResult;
    }

    // Update state
    const state: SyncState = loadState();
    state.last_sync = new Date().toISOString();
    state.beads_hash = getFileHash(BEADS_FILE);
    state.cody_hash = getFileHash(CODY_BACKLOG);

    // Get current commit
    try {
      const commitResult: CommandResult = await runCommand("git", ["rev-parse", "HEAD"]);
      if (commitResult.success) {
        state.last_sync_commit = commitResult.output.trim();
      }
    } catch (error: unknown) {
      // Ignore commit error
    }

    saveState(state);

    // Auto-commit if safe
    if (["pre-commit", "ci"].includes(trigger)) {
      await autoCommitSyncChanges(`Automated sync (${trigger})`);
    }

    log("Automated sync completed successfully");
    return { success: true, message: "Sync completed" };

  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    log(`Automated sync failed: ${errorMessage}`, "error");
    return { success: false, message: errorMessage };
  }
}

// CLI Interface
async function main(): Promise<void> {
  const args: string[] = process.argv.slice(2);
  const trigger: string = args.find((arg: string) => arg.startsWith("--trigger="))?.split("=")[1] || "manual";
  const force: boolean = args.includes("--force");
  const verbose: boolean = args.includes("--verbose");

  if (verbose) {
    console.log("Running in verbose mode");
  }

  const sync = {
    runAutomatedSync,
    runSyncWithRollback: async () => {
      // Simple implementation for force mode
      return runSyncWithRollback();
    }
  };

  if (force) {
    // Force sync by bypassing change detection
    const result: { success: boolean; message: string } = await sync.runSyncWithRollback();
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
    }
  } else {
    const result: { success: boolean; message: string } = await sync.runAutomatedSync(trigger);
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
    }
  }
}

// Run the script - don't use process.exit() in Bun environment
main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  // Let Bun handle the exit naturally
});

export { runAutomatedSync };
