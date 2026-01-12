/**
 * Task Return Type - Standard return format for scheduled tasks
 */
export interface TaskReturn {
  success: boolean;
  summary?: string;
  error?: string;
  data?: any;
}

/**
 * Task Function Type - Standard signature for scheduled task functions
 */
export type TaskFunction = (parameters?: Record<string, any>) => Promise<TaskReturn>;
