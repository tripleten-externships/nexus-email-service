import { Schema, model, Types } from 'mongoose';
import { IInAppMessage, InAppMessageType } from '../../../../packages/types/src/inAppMessage';

const inAppMessageSchema = new Schema<IInAppMessage>(
  {
    messageType: {
      type: String,
      enum: ['user_message', 'system_notification'],
      required: true,
      default: 'user_message',
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Recipient',
      index: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deletedBySender: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedByRecipient: {
      types: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Performance indexes
inAppMessageSchema.index({ recipient: 1, isRead: 1, messageType: 1 });
inAppMessageSchema.index({ sender: 1, messageType: 1, createdAt: -1 });

export const InAppMessage = model<IInAppMessage>('InAppMessage', inAppMessageSchema);
