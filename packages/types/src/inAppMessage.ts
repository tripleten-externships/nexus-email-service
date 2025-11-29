import { Types } from 'mongoose';

export type InAppMessageType = 'user_message' | 'system_notification';

export interface IInAppMessage {
  _id: Types.ObjectId;
  messageType: InAppMessageType;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  subject: String;
  body: String;
  isRead: boolean;
  readAt: Date | null;
  deletedBySender: boolean;
  deletedByRecipient: boolean;
}
