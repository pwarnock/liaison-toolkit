#!/usr/bin/env python3
"""
Show logs for a workflow execution
Simple script to support workflow management while we migrate to TypeScript
"""

import json
import sys
import os
from datetime import datetime


def show_workflow_logs(name, follow=False, limit=None):
    """Display workflow execution logs"""
    logs_dir = "logs/workflows"
    log_file = f"{logs_dir}/{name}.log"

    if not os.path.exists(log_file):
        print(f"❌ No logs found for workflow: {name}")
        print(f"   Expected file: {log_file}")
        sys.exit(1)

    print(f"📋 Workflow Logs: {name}")
    print("=" * 50)

    try:
        with open(log_file, "r") as f:
            lines = f.readlines()

        # Show recent logs first (reverse order)
        lines = [line.strip() for line in lines if line.strip()]
        lines.reverse()

        if limit:
            lines = lines[:limit]

        for i, line in enumerate(lines):
            try:
                log_entry = json.loads(line)
                timestamp = log_entry.get("executed_at", "Unknown")
                status = log_entry.get("status", "Unknown")
                actions = log_entry.get("actions_executed", [])

                print(f"[{i + 1}] {timestamp}")
                print(f"     Status: {status}")
                print(f"     Actions: {', '.join(actions) if actions else 'None'}")
                print()
            except json.JSONDecodeError:
                print(f"[{i + 1}] {line}")
                print()

        if follow:
            print("🔄 Following logs (Ctrl+C to stop)...")
            print("=" * 50)
            # In a real implementation, this would tail the file
            print("   (Follow mode would be implemented in TypeScript version)")

    except Exception as e:
        print(f"❌ Failed to read logs: {e}")
        sys.exit(1)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("❌ Error: Workflow name is required")
        print(
            "Usage: python3 show-workflow-logs.py <name> [--follow] [--limit <number>]"
        )
        sys.exit(1)

    name = sys.argv[1]
    follow = "--follow" in sys.argv
    limit = None

    # Parse limit if provided
    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == "--limit" and i + 1 < len(sys.argv):
            try:
                limit = int(sys.argv[i + 1])
            except ValueError:
                print("❌ Error: Limit must be a number")
                sys.exit(1)

    try:
        show_workflow_logs(name, follow, limit)
    except Exception as e:
        print(f"❌ Failed to show logs: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
