#!/usr/bin/env python3
"""
Create a new workflow
Simple script to support workflow management while we migrate to TypeScript
"""

import json
import sys
import os


def create_workflow(name, template=None, description=None):
    """Create a new workflow configuration"""
    workflow = {
        "id": name.lower().replace(" ", "-"),
        "name": name,
        "description": description or f"Custom workflow: {name}",
        "created_at": "2025-12-14T17:30:00Z",
        "triggers": [],
        "actions": [],
        "template": template or "custom",
    }

    workflows_dir = "config/workflows"
    os.makedirs(workflows_dir, exist_ok=True)

    workflow_file = f"{workflows_dir}/{workflow['id']}.json"
    with open(workflow_file, "w") as f:
        json.dump(workflow, f, indent=2)

    print(f"✅ Created workflow: {workflow['id']}")
    print(f"   File: {workflow_file}")
    return workflow


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("❌ Error: Workflow name is required")
        print(
            "Usage: python3 create-workflow.py <name> [--template <template>] [--description <description>]"
        )
        sys.exit(1)

    name = sys.argv[1]
    template = None
    description = None

    # Parse arguments
    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == "--template" and i + 1 < len(sys.argv):
            template = sys.argv[i + 1]
        elif arg == "--description" and i + 1 < len(sys.argv):
            description = sys.argv[i + 1]

    try:
        workflow = create_workflow(name, template, description)
        print(f"🎯 Workflow '{name}' created successfully")
    except Exception as e:
        print(f"❌ Failed to create workflow: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
