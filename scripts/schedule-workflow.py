#!/usr/bin/env python3
"""
Schedule a workflow to run at a specific time
Simple script to support workflow management while we migrate to TypeScript
"""

import json
import sys
import os
from datetime import datetime


def schedule_workflow(name, time, recurring=False, interval=None):
    """Schedule a workflow for execution"""
    workflows_dir = "config/workflows"
    workflow_file = f"{workflows_dir}/{name}.json"

    if not os.path.exists(workflow_file):
        print(f"❌ Workflow not found: {name}")
        print(f"   Expected file: {workflow_file}")
        sys.exit(1)

    # Load workflow configuration
    with open(workflow_file, "r") as f:
        workflow = json.load(f)

    # Create schedule entry
    schedule_entry = {
        "workflow_id": name,
        "workflow_name": workflow["name"],
        "scheduled_time": time,
        "recurring": recurring,
        "interval": interval,
        "created_at": datetime.now().isoformat(),
        "status": "scheduled",
    }

    # Save schedule
    schedules_dir = "config/schedules"
    os.makedirs(schedules_dir, exist_ok=True)
    schedule_file = f"{schedules_dir}/{name}.schedule"

    with open(schedule_file, "w") as f:
        json.dump(schedule_entry, f, indent=2)

    print(f"⏰ Scheduled workflow: {workflow['name']}")
    print(f"   Time: {time}")
    if recurring:
        print(f"   Recurring: Yes (interval: {interval})")
    else:
        print("   Recurring: No")
    print(f"   Schedule file: {schedule_file}")

    return schedule_entry


def main():
    """Main entry point"""
    if len(sys.argv) < 3:
        print("❌ Error: Workflow name and schedule time are required")
        print(
            "Usage: python3 schedule-workflow.py <name> <time> [--recurring] [--interval <interval>]"
        )
        sys.exit(1)

    name = sys.argv[1]
    time = sys.argv[2]
    recurring = "--recurring" in sys.argv
    interval = None

    # Parse interval if provided
    for i, arg in enumerate(sys.argv[3:], 3):
        if arg == "--interval" and i + 1 < len(sys.argv):
            interval = sys.argv[i + 1]

    try:
        schedule = schedule_workflow(name, time, recurring, interval)
        print(f"✅ Workflow '{name}' scheduled successfully")
    except Exception as e:
        print(f"❌ Failed to schedule workflow: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
