#!/usr/bin/env python3
import subprocess
import json
import sys

# Get task list using liaison
result = subprocess.run(
    ['bun', 'packages/liaison/src/cli.ts', 'task', 'list', '--json'],
    capture_output=True,
    text=True,
    timeout=30
)

if result.returncode != 0:
    print("❌ Failed to fetch tasks")
    sys.exit(1)

# Extract JSON from output (skip plugin logs)
lines = result.stdout.split('\n')
json_start = None
for i, line in enumerate(lines):
    if line.strip() == '[':
        json_start = i
        break

if json_start is None:
    print("❌ Could not find JSON data")
    sys.exit(1)

json_str = '\n'.join(lines[json_start:])
try:
    tasks = json.loads(json_str)
except json.JSONDecodeError as e:
    print(f"❌ JSON parsing error: {e}")
    sys.exit(1)

# Filter for non-closed tasks, exclude Test API duplicates
next_tasks = [
    t for t in tasks 
    if t.get('status') != 'closed' 
    and 'Test API' not in t.get('title', '')
]

if next_tasks:
    print('\n✨ Next available tasks:')
    for i, task in enumerate(next_tasks[:5], 1):
        priority = task.get('priority', 'N/A')
        print(f"{i}. [{task['id']}] {task['title']} (Priority: {priority})")
    if len(next_tasks) > 5:
        print(f"... and {len(next_tasks) - 5} more tasks")
else:
    print('✅ All tasks are completed!')