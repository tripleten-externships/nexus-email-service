import mongoose, { Schema, Model } from 'mongoose';

/**
 * Task Model - Represents scheduled tasks that run via EventBridge/CloudWatch Events
 */
export interface ITask {
  functionName: string;
  name: string;
  cron: string;
  enabled: boolean;
  parameters?: Record<string, any>;
  lastRun?: Date;
  lastRunStatus?: 'SUCCESS' | 'FAILED';
  lastRunError?: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Tasks
 */
export const TaskSchema = new Schema<ITask>(
  {
    functionName: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    cron: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastRun: {
      type: Date,
      default: null,
    },
    lastRunStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: null,
    },
    lastRunError: {
      type: String,
      default: null,
    },
    deleted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for optimizing query performance
 */
TaskSchema.index({ functionName: 1, enabled: 1 });
TaskSchema.index({ deleted: 1, enabled: 1 });
TaskSchema.index({ lastRun: -1 });

/**
 * Mongoose Model for Tasks
 */
export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
