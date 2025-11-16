import { Document, SortOrder } from 'mongoose';
import log from '../../logging/log';
import { Task, ITask } from './task';

interface TaskDocument extends ITask, Document {}

/**
 * Find a task by ID
 */
const findTaskById = async (taskId: string, allowDeleted = false): Promise<TaskDocument | null> => {
  if (!taskId) {
    throw new Error('Task ID is required');
  }
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  if (!allowDeleted && task.deleted) {
    throw new Error('Task is deleted');
  }
  return task as TaskDocument;
};

/**
 * List tasks with filtering and pagination
 */
const listTasks = async ({
  filter = {},
  sort = {},
  skip = 0,
  limit = 100,
  allowDeleted = false,
}: {
  filter?: Partial<ITask>;
  sort?: Record<string, SortOrder>;
  skip?: number;
  limit?: number;
  allowDeleted?: boolean;
}): Promise<TaskDocument[]> => {
  // Make sure we don't list the deleted items, unless we really want to.
  const queryFilter: any = { ...filter };
  if (!allowDeleted) {
    queryFilter.deleted = false;
  }

  const tasks = await Task.find(queryFilter).sort(sort).skip(skip).limit(limit);
  return tasks as TaskDocument[];
};

/**
 * Get a single task by ID
 */
const getTask = async (taskId: string): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  return task;
};

/**
 * Add a new task
 */
interface AddTaskParameters {
  functionName: string;
  name: string;
  cron: string;
  enabled?: boolean;
  parameters?: Record<string, any>;
}

const addTask = async (taskParams: AddTaskParameters): Promise<TaskDocument> => {
  let task;
  try {
    task = await Task.create(taskParams);
  } catch (error) {
    log.error(`Error creating task: ${error}`);
    throw new Error('Failed to create task');
  }
  return task as TaskDocument;
};

/**
 * Update an existing task
 */
interface UpdateTaskParameters {
  functionName?: string;
  name?: string;
  cron?: string;
  enabled?: boolean;
  parameters?: Record<string, any>;
}

const updateTask = async (
  taskId: string,
  taskData: UpdateTaskParameters
): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  Object.assign(task, taskData);
  const updatedTask = await task.save();
  return updatedTask as TaskDocument;
};

/**
 * Soft delete a task
 */
const deleteTask = async (taskId: string): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  task.deleted = true;
  const updatedTask = await task.save();
  return updatedTask as TaskDocument;
};

/**
 * Disable a task
 */
const disableTask = async (taskId: string): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  task.enabled = false;
  const updatedTask = await task.save();
  return updatedTask as TaskDocument;
};

/**
 * Enable a task
 */
const enableTask = async (taskId: string): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  task.enabled = true;
  const updatedTask = await task.save();
  return updatedTask as TaskDocument;
};

/**
 * Update task run status after execution
 */
const updateTaskRunStatus = async (
  taskId: string,
  status: 'SUCCESS' | 'FAILED',
  error?: string
): Promise<TaskDocument | null> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  task.lastRun = new Date();
  task.lastRunStatus = status;
  task.lastRunError = error || undefined;
  const updatedTask = await task.save();
  return updatedTask as TaskDocument;
};

export {
  addTask,
  deleteTask,
  disableTask,
  enableTask,
  findTaskById,
  getTask,
  listTasks,
  updateTask,
  updateTaskRunStatus,
};

export default Task;
