import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateAgentConfig, generateConfig } from '../utils/template-engine.js';
import { FREE_MODELS } from '../types/models.js';

export interface SetupOptions {
  projectPath: string;
  agents?: string[];
  model?: string;
  overwrite?: boolean;
}

const DEFAULT_AGENTS = ['library-researcher', 'code-reviewer', 'docs-writer'];

export async function setupOpenCodeConfig(options: SetupOptions): Promise<void> {
  const { projectPath, agents = DEFAULT_AGENTS, model = 'big-pickle', overwrite = false } = options;
  
  // Create .opencode directory structure
  const opencodeDir = join(projectPath, '.opencode');
  const agentDir = join(opencodeDir, 'agent');
  
  if (!existsSync(opencodeDir)) {
    mkdirSync(opencodeDir, { recursive: true });
    console.log(`Created ${opencodeDir}`);
  }
  
  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
    console.log(`Created ${agentDir}`);
  }
  
  // Generate main config.json
  const configPath = join(opencodeDir, 'config.json');
  if (!existsSync(configPath) || overwrite) {
    const config = generateConfig({ 
      model: `openrouter/z-ai/${model}`,
      agents: agents.reduce((acc, agent) => {
        acc[agent] = { model: `openrouter/z-ai/${model}` };
        return acc;
      }, {} as Record<string, { model: string }>)
    });
    writeFileSync(configPath, config);
    console.log(`Created ${configPath}`);
  } else {
    console.log(`Config already exists at ${configPath} (use --overwrite to replace)`);
  }
  
  // Generate agent configurations
  for (const agentName of agents) {
    const agentConfig = generateAgentConfig(agentName, {
      description: getDefaultDescription(agentName),
      temperature: getDefaultTemperature(agentName)
    });
    
    const agentPath = join(agentDir, `${agentName}.md`);
    if (!existsSync(agentPath) || overwrite) {
      writeFileSync(agentPath, agentConfig);
      console.log(`Created ${agentPath}`);
    } else {
      console.log(`Agent config already exists at ${agentPath} (use --overwrite to replace)`);
    }
  }
  
  console.log('\n✅ OpenCode configuration setup complete!');
  console.log(`📁 Configuration directory: ${opencodeDir}`);
  console.log(`🤖 Agents configured: ${agents.join(', ')}`);
  console.log(`🧠 Model: ${FREE_MODELS[model]?.name || model}`);
}

function getDefaultDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    'library-researcher': 'Researches libraries, frameworks, and APIs to provide accurate documentation and usage examples',
    'code-reviewer': 'Reviews code for quality, security, performance, and best practices',
    'docs-writer': 'Creates and improves technical documentation, README files, and API docs'
  };
  return descriptions[agentName] || `Specialized ${agentName} agent`;
}

function getDefaultTemperature(agentName: string): number {
  const temperatures: Record<string, number> = {
    'library-researcher': 0.2,
    'code-reviewer': 0.3,
    'docs-writer': 0.4
  };
  return temperatures[agentName] || 0.3;
}