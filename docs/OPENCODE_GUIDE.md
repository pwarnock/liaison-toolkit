# OpenCode Configuration Management

OpenCode configuration management provides seamless integration with AI agent systems through Liaison CLI. This is an **optional plugin** that enhances Liaison with AI agent configuration capabilities.

## 🚀 Quick Start

### Installation

```bash
# Install Liaison with OpenCode support
npm install @pwarnock/liaison @pwarnock/opencode_config

# Or add OpenCode to existing Liaison installation
npm install @pwarnock/opencode_config
```

### Basic Usage

```bash
# Setup OpenCode configuration with default agents
liaison opencode

# Setup with custom agents and model
liaison opencode --agents "library-researcher,code-reviewer,docs-writer" --model big-pickle

# Create individual agent
liaison opencode agent my-agent --template custom-agent --model grok-fast

# List available models and templates
liaison opencode --list-models
liaison opencode --list-agents
```

## 🧠 Available Models

### Free Models Registry

| Model ID | Name | Context | Cost | Best For |
|-----------|------|---------|-------|-----------|
| `big-pickle` | Big Pickle (GLM 4.6) | 200K | Research, analysis, documentation |
| `grok-fast` | Grok Code Fast 1 | 256K | Code review, quick analysis, security |
| `kat-coder` | KAT-Coder-Pro V1 | 100K | Documentation, code generation, tutorials |

### Model Selection

```bash
# Use Big Pickle for general purpose tasks
liaison opencode --model big-pickle

# Use Grok Fast for code review
liaison opencode agent code-reviewer --model grok-fast

# Use KAT-Coder for documentation
liaison opencode agent docs-writer --model kat-coder
```

## 📝 Agent Templates

### Available Templates

| Template | Description | Use Case |
|----------|-------------|-----------|
| `custom-agent` | Generic agent template for any purpose | General purpose tasks and custom workflows |
| `code-reviewer` | Specialized for code review and quality assurance | Reviewing pull requests, code quality checks |
| `library-researcher` | Researches libraries, frameworks, and APIs | Documentation research, API integration help |
| `docs-writer` | Technical writing and documentation specialist | Writing README files, API docs, tutorials |

### Creating Agents

```bash
# Create a custom agent
liaison opencode agent my-assistant \
  --template custom-agent \
  --model big-pickle \
  --description "My personal AI assistant" \
  --temperature 0.2

# Create a code reviewer
liaison opencode agent security-reviewer \
  --template code-reviewer \
  --model grok-fast \
  --description "Security-focused code reviewer" \
  --temperature 0.1

# Overwrite existing agent
liaison opencode agent my-assistant --overwrite
```

## ⚙️ Configuration Management

### Directory Structure

OpenCode creates a `.opencode/` directory in your project:

```
.opencode/
├── config.json          # Main OpenCode configuration
└── agent/              # Individual agent configurations
    ├── library-researcher.md
    ├── code-reviewer.md
    └── docs-writer.md
```

### Main Configuration

The `config.json` file contains:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "theme": "github-dark",
  "model": "openrouter/z-ai/glm-4.6",
  "tools": {
    "webfetch": true,
    "bash": true,
    "edit": true,
    "read": true
  },
  "provider": {
    "openrouter": {
      "options": {
        "apiKey": "{env:OPENROUTER_API_KEY}",
        "defaultModel": "openrouter/z-ai/glm-4.6"
      }
    }
  }
}
```

### Agent Configuration

Each agent file contains specialized configuration:

```markdown
# Library Researcher

A specialized agent for researching and analyzing libraries, frameworks, and APIs.

## Configuration

```json
{
  "name": "library-researcher",
  "description": "Researches libraries, frameworks, and APIs to provide accurate documentation and usage examples",
  "model": "openrouter/z-ai/glm-4.6",
  "temperature": 0.2,
  "maxTokens": 8000,
  "systemPrompt": "You are a Library Researcher, specialized in researching and analyzing libraries, frameworks, and APIs...",
  "tools": ["webfetch", "read", "codesearch"]
}
```

## 🔧 Advanced Usage

### Custom Agent Templates

Create your own agent templates by adding `.template` files to the templates directory:

```bash
# Create custom template
echo "# {{name}}

{{description}}

## Configuration
\`\`\`json
{
  \"name\": \"{{name}}\",
  \"model\": \"{{model}}\",
  \"temperature\": {{temperature}}
}
\`\`\`" > .opencode/templates/my-template.md.template

# Use custom template
liaison opencode agent my-agent --template my-template
```

### Environment Variables

Set up required environment variables:

```bash
# OpenRouter API key (required for free models)
export OPENROUTER_API_KEY="your-api-key-here"

# Optional: Custom model endpoints
export CUSTOM_MODEL_ENDPOINT="https://api.example.com"
```

### Configuration Validation

```bash
# Validate OpenCode configuration
liaison opencode --validate

# Check agent configuration
liaison opencode agent my-agent --validate
```

## 📋 Command Reference

### Main Command

```bash
liaison opencode [options]
```

**Options:**
- `-d, --directory <path>` - Target directory for configuration (default: current directory)
- `-a, --agents <agents>` - Comma-separated list of agents to create (default: library-researcher,code-reviewer)
- `-m, --model <model>` - Default model to use (default: big-pickle)
- `--list-models` - List available free models
- `--list-agents` - List available agent templates

### Agent Subcommand

```bash
liaison opencode agent <name> [options]
```

**Arguments:**
- `<name>` - Agent name (required)

**Options:**
- `-t, --template <template>` - Agent template to use (default: custom-agent)
- `-m, --model <model>` - Model for this agent (default: big-pickle)
- `-d, --description <description>` - Agent description
- `--temperature <temp>` - Agent temperature (0.0-1.0, default: 0.1)
- `--overwrite` - Overwrite existing agent file

## 🚨 Troubleshooting

### Common Issues

**"OpenCode configuration package not found"**
```bash
# Install the optional dependency
npm install @pwarnock/opencode_config

# Or install globally
npm install -g @pwarnock/opencode_config
```

**"Agent already exists"**
```bash
# Use --overwrite to replace existing agent
liaison opencode agent my-agent --overwrite
```

**"Model not found"**
```bash
# List available models
liaison opencode --list-models

# Use correct model ID
liaison opencode --model big-pickle  # not "Big Pickle"
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=opencode:*

# Run with verbose output
liaison opencode --verbose
```

### Reset Configuration

```bash
# Remove OpenCode configuration
rm -rf .opencode/

# Re-setup with defaults
liaison opencode
```

## 🔗 Integration with Liaison

### Task-Driven Workflows

OpenCode integrates seamlessly with Liaison's task-driven workflows:

```bash
# Create task that triggers agent setup
liaison task create "Setup AI agents for project" \
  --auto-trigger "opencode-setup" \
  --priority high

# Task automatically runs:
# liaison opencode --agents "library-researcher,code-reviewer"
```

### Plugin Architecture

OpenCode follows Liaison's plugin architecture:

- **Optional Dependency**: Only installed when needed
- **Graceful Degradation**: Works without OpenCode package
- **Consistent CLI**: Follows Liaison command patterns
- **Error Handling**: Provides helpful error messages

## 📚 Examples

### Project Setup

```bash
# Setup new project with AI agents
mkdir my-project && cd my-project
npm init -y
npm install @pwarnock/liaison @pwarnock/opencode_config

# Initialize Liaison
liaison init

# Setup OpenCode with research and documentation agents
liaison opencode --agents "library-researcher,docs-writer" --model kat-coder

# Create custom agent for project-specific tasks
liaison opencode agent project-helper \
  --template custom-agent \
  --description "Helper for my-project specific tasks" \
  --temperature 0.3
```

### Team Configuration

```bash
# Setup team workspace
liaison opencode \
  --agents "library-researcher,code-reviewer,docs-writer,security-reviewer" \
  --model big-pickle \
  --directory ./team-config

# Share configuration with team
git add .opencode/
git commit -m "Add OpenCode AI agent configuration"
git push
```

## 🤝 Contributing

OpenCode is part of the Liaison Toolkit ecosystem. Contributions welcome!

- **Repository**: https://github.com/pwarnock/liaison-toolkit
- **Package**: `packages/opencode_config/`
- **Issues**: https://github.com/pwarnock/liaison-toolkit/issues

## 📄 License

MIT License - see LICENSE file for details.