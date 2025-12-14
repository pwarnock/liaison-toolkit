import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FREE_MODELS } from '../types/models.js';
import { AgentOptions, ConfigOptions } from '../types/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the package root directory (go up from src/utils to package root)
const packageRoot = dirname(dirname(__dirname));

/**
 * Template processing system for OpenCode agent configurations
 */

export function generateAgentConfig(name: string, options: AgentOptions = {}): string {
  const templatePath = pathJoin(packageRoot, 'templates/agents/custom-agent.md.template');
  const template = readFileSync(templatePath, 'utf8');
  
  // Use default model (big-pickle) - models managed through configuration
  const modelInfo = FREE_MODELS['big-pickle'];
  
  return template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{description\}\}/g, options.description || `Specialized ${name} agent`)
    .replace(/\{\{model\}\}/g, modelInfo.id)
    .replace(/\{\{modelName\}\}/g, modelInfo.name)
    .replace(/\{\{contextWindow\}\}/g, modelInfo.context.toString())
    .replace(/\{\{temperature\}\}/g, (options.temperature || 0.1).toString())
    .replace(/\{\{inputCost\}\}/g, modelInfo.cost.input.toString())
    .replace(/\{\{outputCost\}\}/g, modelInfo.cost.output.toString());
}

export function generateConfig(options: ConfigOptions = {}): string {
  const defaultModel = options.model || 'openrouter/z-ai/glm-4.6';
  
  return JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    theme: "github-dark",
    model: defaultModel,
    tools: { 
      webfetch: true, 
      bash: true, 
      edit: true, 
      read: true 
    },
    agent: options.agents || {},
    provider: {
      openrouter: {
        options: {
          apiKey: "{env:OPENROUTER_API_KEY}",
          defaultModel: defaultModel
        }
      }
    }
  }, null, 2);
}

export function loadTemplate(templateName: string): string {
  const templatePath = pathJoin(packageRoot, 'templates/agents', `${templateName}.md.template`);
  return readFileSync(templatePath, 'utf8');
}