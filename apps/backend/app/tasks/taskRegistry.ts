import log from '../../logging/log';
import { TaskFunction } from './types/taskReturn';

/**
 * Task Registry - Maps function names to actual task implementations
 */
const taskRegistry: Map<string, TaskFunction> = new Map();

/**
 * Register a task function
 */
export const registerTask = (functionName: string, taskFunction: TaskFunction): void => {
  if (taskRegistry.has(functionName)) {
    log.warn(`Task function ${functionName} is already registered. Overwriting.`);
  }
  taskRegistry.set(functionName, taskFunction);
  log.info(`Registered task function: ${functionName}`);
};

/**
 * Get a task function by name
 */
export const getTaskFunction = (functionName: string): TaskFunction | undefined => {
  const taskFunction = taskRegistry.get(functionName);
  if (!taskFunction) {
    log.error(`Task function ${functionName} not found in registry`);
  }
  return taskFunction;
};

/**
 * Get all registered task names
 */
export const getRegisteredTaskNames = (): string[] => {
  return Array.from(taskRegistry.keys());
};

/**
 * Check if a task is registered
 */
export const isTaskRegistered = (functionName: string): boolean => {
  return taskRegistry.has(functionName);
};

// Import and register task modules here
// Tasks will be registered when their modules are imported
