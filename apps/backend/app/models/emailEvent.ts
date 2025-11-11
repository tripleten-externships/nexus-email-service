import mongoose, { Schema, Model } from 'mongoose';
import validator from 'validator';

/**
 * Email Event Model
 */
export interface IEmailEvent {
  messageId: string;
  recipientEmail: string;
  eventType: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  geoLocationData: string;
}

/**
 * Mongoose Schema for Email Events
 */
export const EmailEventSchema = new Schema<IEmailEvent>(
  {
    messageId: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => validator.isEmail(v),
        message: 'Invalid email address',
      },
    },
    eventType: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => validator.isIP(v),
        message: 'Invalid IP address',
      },
    },
    userAgent: {
      type: String,
      required: true,
    },
    geoLocationData: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

/**
 * Indexes for optimizing query performance
 */
EmailEventSchema.index({ messageId: 1, timestamp: -1 });
EmailEventSchema.index({ messageId: 1, eventType: 1 });
EmailEventSchema.index({ recipientEmail: 1, eventType: 1 });
EmailEventSchema.index({ eventType: 1, timestamp: -1 });
EmailEventSchema.index({ timestamp: -1, geoLocationData: 1 });

/**
 * TTL Index to auto-delete documents after 90 days
 */
EmailEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

/**
 * Mongoose Model for Email Events
 */
export const EmailEvent: Model<IEmailEvent> = mongoose.model<IEmailEvent>(
  'EmailEvent',
  EmailEventSchema
);

/**
 * Analytical Query Functions
 */
export async function getEventCountsByType() {
  return EmailEvent.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

/**
 * Get hourly trends of email events for the past 24 hours
 */
export async function getHourlyEventTrends() {
  return EmailEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          eventType: '$eventType',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.hour': 1 } },
  ]);
}

/**
 * Get geographical engagement data
 */
export async function getGeoEngagement() {
  return EmailEvent.aggregate([
    {
      $group: {
        _id: '$geoLocationData',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
}
