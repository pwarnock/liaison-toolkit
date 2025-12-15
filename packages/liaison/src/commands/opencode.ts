import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export function createOpenCodeCommand() {
  const command = new Command('opencode')
    .description('OpenCode configuration management (optional plugin)')
    .option('-d, --directory <path>', 'Target directory for configuration', process.cwd())
    .option('-a, --agents <agents>', 'Comma-separated list of agents to create', 'library-researcher,code-reviewer')
    .option('--overwrite', 'Overwrite existing configuration')
    .option('--list-models', 'List available free models')
    .option('--list-agents', 'List available agent templates')
    .action(async (options) => {
      try {
        // Check if OpenCode config package is available
        let opencodeConfig: any;
        try {
          // @ts-ignore - Optional dependency
          opencodeConfig = await import('@pwarnock/opencode_config');
        } catch (importError) {
          console.error(chalk.red('❌ OpenCode configuration package not found'));
          console.error(chalk.yellow('💡 Install it with: bun add @pwarnock/opencode_config'));
          console.error(chalk.gray('   Or run: liaison plugin install opencode-config'));
          process.exit(1);
        }

        if (options.listModels) {
          await listModels();
          return;
        }

        if (options.listAgents) {
          await listAgentTemplates();
          return;
        }

        const spinner = ora('Setting up OpenCode configuration...').start();
        
        try {
          const agentList = options.agents.split(',').map((a: string) => a.trim());
          const config = {
            projectPath: options.directory,
            agents: agentList,
            overwrite: options.overwrite || false
          };

          spinner.text = 'Creating configuration directory...';
          await opencodeConfig.setupOpenCodeConfig(config);
          
          spinner.succeed(chalk.green('OpenCode configuration setup complete!'));
          console.log(chalk.gray(`📁 Configuration directory: ${options.directory}/.opencode`));
          console.log(chalk.gray(`🤖 Agents configured: ${agentList.join(', ')}`));
          process.exit(0);
          
        } catch (setupError) {
          spinner.fail(chalk.red('Setup failed'));
          throw setupError;
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Setup failed: ${error}`));
        process.exit(1);
      }
    });

  // Add subcommands
  command
    .command('agent')
    .description('Create individual agent')
    .argument('<name>', 'Agent name')
    .option('-t, --template <template>', 'Agent template to use', 'custom-agent')
    .option('-d, --description <description>', 'Agent description')
    .option('--temperature <temp>', 'Agent temperature (0.0-1.0)', '0.1')
    .option('--overwrite', 'Overwrite existing agent file')
    .action(async (name, options) => {
      const spinner = ora(`Creating agent: ${name}`).start();
      
      try {
        // Check if OpenCode config package is available
        let opencodeConfig: any;
        try {
          // @ts-ignore - Optional dependency
          opencodeConfig = await import('@pwarnock/opencode_config');
        } catch (importError) {
          spinner.fail(chalk.red('OpenCode configuration package not found'));
          console.error(chalk.yellow('💡 Install it with: bun add @pwarnock/opencode_config'));
          process.exit(1);
        }

        spinner.text = 'Validating agent name...';
        
        // Validate agent name
        if (!name || name.trim().length === 0) {
          throw new Error('Agent name is required');
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
          throw new Error('Agent name can only contain letters, numbers, hyphens, and underscores');
        }

        spinner.text = 'Generating agent configuration...';
        

        
        // Generate subagent configuration
        const agentContent = opencodeConfig.generateSubagentConfig(name, {
          description: options.description,
          temperature: parseFloat(options.temperature)
        });
        



        spinner.text = 'Creating .opencode directory...';
        
        // Create .opencode/agent directory if it doesn't exist
        const { mkdirSync, writeFileSync, existsSync } = await import('fs');
        const { join } = await import('path');
        
        const opencodeDir = join(process.cwd(), '.opencode');
        const agentDir = join(opencodeDir, 'agent');
        
        if (!existsSync(opencodeDir)) {
          mkdirSync(opencodeDir, { recursive: true });
        }
        
        if (!existsSync(agentDir)) {
          mkdirSync(agentDir, { recursive: true });
        }

        spinner.text = 'Writing agent file...';
        
        // Write subagent configuration
        const agentPath = join(agentDir, `${name}.json`);
        
        if (existsSync(agentPath) && !options.overwrite) {
          spinner.warn(chalk.yellow(`Agent ${name} already exists`));
          console.log(chalk.gray(`   File: ${agentPath}`));
          console.log(chalk.gray('   Use --overwrite to replace existing agent'));
          process.exit(0);
        }
        
        writeFileSync(agentPath, agentContent);
        
        const action = existsSync(agentPath) && options.overwrite ? 'updated' : 'created';
        spinner.succeed(chalk.green(`Agent ${name} ${action} successfully!`));
        console.log(chalk.gray(`📁 Agent file: ${agentPath}`));
        console.log(chalk.gray(`📝 Template: ${options.template}`));
        if (options.description) {
          console.log(chalk.gray(`📄 Description: ${options.description}`));
        }
        process.exit(0);
        
        } catch (error) {
          spinner.fail(chalk.red(`Agent creation failed`));
          console.error(chalk.red(`❌ ${error}`));
          process.exit(1);
        }
    });

  return command;
}

async function listModels() {
  try {
    // @ts-ignore - Optional dependency
    const opencodeConfig = await import('@pwarnock/opencode_config');
    
    console.log(chalk.bold('📋 Available Free Models:'));
    console.log();
    
    const models = opencodeConfig.listModels();
    
    models.forEach((model: any) => {
      console.log(`${chalk.cyan(model.id)} - ${chalk.green(model.name)}`);
      console.log(`  ${chalk.gray(model.bestFor.join(', '))}`);
      console.log(`  Context: ${model.context.toLocaleString()} tokens`);
      console.log(`  Cost: $${model.cost.input}/1K input, $${model.cost.output}/1K output`);
      console.log();
    });
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ OpenCode configuration package not found'));
    console.error(chalk.yellow('💡 Install it with: bun add @pwarnock/opencode_config'));
    process.exit(1);
  }
}

async function listAgentTemplates() {
  console.log(chalk.bold('📋 Available Agent Templates:'));
  console.log();
  
  const templates = [
    {
      name: 'custom-agent',
      description: 'Generic agent template for any purpose',
      useCase: 'General purpose tasks and custom workflows'
    },
    {
      name: 'code-reviewer',
      description: 'Specialized for code review and quality assurance',
      useCase: 'Reviewing pull requests, code quality checks'
    },
    {
      name: 'library-researcher',
      description: 'Researches libraries, frameworks, and APIs',
      useCase: 'Documentation research, API integration help'
    },
    {
      name: 'docs-writer',
      description: 'Technical writing and documentation specialist',
      useCase: 'Writing README files, API docs, tutorials'
    }
  ];

  templates.forEach((template: any) => {
    console.log(`${chalk.cyan(template.name)} - ${chalk.green(template.description)}`);
    console.log(`  ${chalk.gray('Use case:')} ${template.useCase}`);
    console.log();
  });
  process.exit(0);
}