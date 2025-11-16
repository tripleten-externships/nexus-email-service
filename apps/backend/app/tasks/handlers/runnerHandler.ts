import { Context, Handler } from 'aws-lambda';
import log from '../../../logging/log';
import initializeDBConnection from '../../../db/db';
import { findTaskById, updateTaskRunStatus } from '../../models/taskModel';
import { getTaskFunction } from '../taskRegistry';
import { TaskReturn } from '../types/taskReturn';

/**
 * Runner Handler - Executes a specific task and updates its status in the database
 */
const runnerHandler: Handler = async (
  event: { taskId: string },
  context: Context
): Promise<void> => {
  // the following line is critical for performance reasons to allow re-use of db
  // connections across calls to this Lambda function and avoid closing the db connection
  context.callbackWaitsForEmptyEventLoop = false;

  await initializeDBConnection({ runServerless: true });
  log.debug('EVENT', JSON.stringify(event));

  const { taskId } = event;
  if (!taskId) {
    log.error('ERROR: Was not passed taskId. Bailing!');
    context.fail('Missing taskId parameter');
    return;
  }

  let task;
  try {
    task = await findTaskById(taskId);
  } catch (error) {
    log.error(`ERROR: Failed to load task ${taskId}: ${error}`);
    context.fail(`Task ${taskId} not found`);
    return;
  }

  if (!task) {
    log.error(`ERROR: Task ${taskId} does not exist`);
    context.fail(`Task ${taskId} does not exist`);
    return;
  }

  log.info(
    `TASK: (${taskId}) EXECUTING: ${task.functionName} - ${JSON.stringify(task.parameters)}`
  );

  // Get the task function from the registry
  const taskFunction = getTaskFunction(task.functionName);
  if (!taskFunction) {
    const errorMsg = `Task function ${task.functionName} not found in registry`;
    log.error(errorMsg);
    await updateTaskRunStatus(taskId, 'FAILED', errorMsg);
    context.fail(errorMsg);
    return;
  }

  // Execute the task
  let taskReturn: TaskReturn;
  let errors = false;
  try {
    taskReturn = await taskFunction(task.parameters);

    if (taskReturn.success) {
      await updateTaskRunStatus(taskId, 'SUCCESS');
      log.info(`TASK: (${taskId}) - SUCCEEDED - ${taskReturn.summary || 'No summary'}`);
    } else {
      await updateTaskRunStatus(
        taskId,
        'FAILED',
        taskReturn.error || 'Task returned success: false'
      );
      log.error(`TASK: (${taskId}) - FAILED - ${taskReturn.error || 'No error message'}`);
      errors = true;
    }
  } catch (error) {
    log.error(`TASK: ${taskId} ERROR EXECUTING FUNCTION: ${task.functionName}`, error);
    const errorMsg = `Error executing task: ${error instanceof Error ? error.message : String(error)}`;
    await updateTaskRunStatus(taskId, 'FAILED', errorMsg);
    errors = true;
  }

  if (errors) {
    context.fail('FAILED');
  } else {
    log.info(`TASK: (${taskId}) - Done!`);
    context.succeed('SUCCEEDED');
  }
};

export default runnerHandler;
