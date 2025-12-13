import { BeadsAdapter } from './packages/liaison/src/reconciler/adapters/beads-adapter.ts';

async function updateTaskStatus() {
  try {
    const adapter = new BeadsAdapter(true);

    // Health check first
    const healthy = await adapter.healthCheck();
    if (!healthy) {
      console.error('Backend is not available. Check your setup.');
      process.exit(1);
    }

    // Update task status to completed
    const task = await adapter.updateTaskStatus('owk-cfr', 'closed');

    console.log('Task updated successfully:');
    console.log(`ID: ${task.id}`);
    console.log(`Status: ${task.status}`);
    console.log();

    // Verify the update
    const verifiedTask = await adapter.getTask('owk-cfr');
    console.log('Verification:');
    console.log(`Task ${verifiedTask.id} is now ${verifiedTask.status}`);
  } catch (error) {
    console.error(`Failed to update task: ${error}`);
    process.exit(1);
  }
}

updateTaskStatus();
