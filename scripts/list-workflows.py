#!/usr/bin/env python3
"""
List all available workflows
Simple script to support workflow management while we migrate to TypeScript
"""

import json
import os
import sys


def list_workflows():
    """Return list of available workflows"""
    workflows = [
        {
            "id": "security-response",
            "name": "Security Response Workflow",
            "description": "Automated response to security vulnerabilities and critical issues",
            "triggers": ["security", "critical", "vulnerability"],
            "actions": ["investigate", "isolate", "patch", "verify"],
        },
        {
            "id": "bug-fix",
            "name": "Bug Fix Workflow",
            "description": "Automated bug triage and fix process",
            "triggers": ["bug", "production", "error"],
            "actions": ["reproduce", "debug", "fix", "test", "deploy"],
        },
        {
            "id": "high-priority-response",
            "name": "High Priority Response Workflow",
            "description": "Rapid response to high-priority tasks",
            "triggers": ["high-priority", "urgent"],
            "actions": ["assign", "escalate", "notify", "track"],
        },
        {
            "id": "documentation-update",
            "name": "Documentation Update Workflow",
            "description": "Automated documentation updates",
            "triggers": ["documentation", "docs", "readme"],
            "actions": ["update", "review", "publish"],
        },
        {
            "id": "stability-remediation",
            "name": "Stability Remediation Workflow",
            "description": "Comprehensive system stability fixes",
            "triggers": ["stability", "reliability", "performance"],
            "actions": ["analyze", "prioritize", "fix", "validate", "monitor"],
        },
    ]

    return workflows


def main():
    """Main entry point"""
    workflows = list_workflows()

    if "--json" in sys.argv:
        print(json.dumps(workflows, indent=2))
    else:
        print("📋 Available Workflows:")
        print()
        for workflow in workflows:
            print(f"  {workflow['id']}")
            print(f"    {workflow['name']}")
            print(f"    {workflow['description']}")
            print(f"    Triggers: {', '.join(workflow['triggers'])}")
            print(f"    Actions: {', '.join(workflow['actions'])}")
            print()


if __name__ == "__main__":
    main()
