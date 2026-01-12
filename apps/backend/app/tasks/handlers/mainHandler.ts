import { Callback, Context, Handler } from 'aws-lambda';
import log from '../../../logging/log';
import initializeDBConnection from '../../../db/db';
import { listTasks } from '../../models/taskModel';
import { getTaskFunction } from '../taskRegistry';
import { updateTaskRunStatus } from '../../models/taskModel';

/**
 * Main Handler - Scheduled task that runs enabled tasks
 * This handler is invoked by EventBridge/CloudWatch Events on a schedule
 */
const mainHandler: Handler = async (event: any, context: Context): Promise<void> => {
  // the following line is critical for performance reasons to allow re-use of db
  // connections across calls to this Lambda function and avoid closing the db connection
  context.callbackWaitsForEmptyEventLoop = false;
  // the first call to this Lambda function takes about 5 seconds to complete, while subsequent,
  // close calls will only take a few hundred milliseconds

  await initializeDBConnection({ runServerless: true });
  log.info('Main Handler: Starting scheduled task execution');

  try {
    // Get all enabled, non-deleted tasks
    const tasks = await listTasks({
      filter: { enabled: true, deleted: false },
      allowDeleted: false,
    });

    log.info(`Found ${tasks.length} enabled task(s) to execute`);

    if (tasks.length === 0) {
      log.info('No enabled tasks found. Exiting.');
      context.succeed('No tasks to run');
      return;
    }

    // Execute each task
    const results: Array<{
      taskId: string;
      name: string;
      status: 'SUCCESS' | 'FAILED';
      summary?: string;
      error?: string;
    }> = [];
    for (const task of tasks) {
      log.info(`Executing task: ${task.name} (${task.functionName})`);

      try {
        // Get the task function from the registry
        const taskFunction = getTaskFunction(task.functionName);
        if (!taskFunction) {
          const errorMsg = `Task function ${task.functionName} not found in registry`;
          log.error(errorMsg);
          const taskId = String(task._id);
          await updateTaskRunStatus(taskId, 'FAILED', errorMsg);
          results.push({ taskId, name: task.name, status: 'FAILED', error: errorMsg });
          continue;
        }

        // Execute the task
        const taskReturn = await taskFunction(task.parameters);
        const taskId = String(task._id);

        if (taskReturn.success) {
          await updateTaskRunStatus(taskId, 'SUCCESS');
          log.info(`Task ${task.name} completed successfully: ${taskReturn.summary || ''}`);
          results.push({ taskId, name: task.name, status: 'SUCCESS', summary: taskReturn.summary });
        } else {
          const errorMsg = taskReturn.error || 'Task returned success: false';
          await updateTaskRunStatus(taskId, 'FAILED', errorMsg);
          log.error(`Task ${task.name} failed: ${errorMsg}`);
          results.push({ taskId, name: task.name, status: 'FAILED', error: errorMsg });
        }
      } catch (error) {
        const errorMsg = `Error executing task ${task.name}: ${error instanceof Error ? error.message : String(error)}`;
        log.error(errorMsg);
        const taskId = String(task._id);
        await updateTaskRunStatus(taskId, 'FAILED', errorMsg);
        results.push({ taskId, name: task.name, status: 'FAILED', error: errorMsg });
      }
    }

    // Log summary
    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const failureCount = results.filter((r) => r.status === 'FAILED').length;
    log.info(`Main Handler: Completed. Success: ${successCount}, Failed: ${failureCount}`);

    context.succeed(
      `Executed ${tasks.length} task(s). Success: ${successCount}, Failed: ${failureCount}`
    );
  } catch (error) {
    log.error('Main Handler Error:', error);
    context.fail(error as string);
    return;
  }
};

export default mainHandler;
