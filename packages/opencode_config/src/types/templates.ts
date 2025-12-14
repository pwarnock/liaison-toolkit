/**
 * Template interfaces for OpenCode agent configuration
 */

export interface AgentTemplate {
  name: string;
  description: string;
  mode: 'primary' | 'subagent';
  model?: string;
  temperature?: number;
  tools: Record<string, boolean>;
  permissions?: Record<string, string>;
}

export interface AgentOptions {
  model?: string;
  template?: string;
  temperature?: number;
  description?: string;
}

export interface ConfigOptions {
  model?: string;
  provider?: string;
  agents?: Record<string, AgentConfig>;
}

export interface AgentConfig {
  description?: string;
  mode?: string;
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  permissions?: Record<string, string>;
}