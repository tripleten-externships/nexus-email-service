import { Types } from 'mongoose';

/**
 * Attachment metadata for email attachments
 */
export interface IAttachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: string;
  disposition?: 'attachment' | 'inline';
}

/**
 * Recipient read status tracking
 */
export interface IRecipientStatus {
  userId: Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
}

/**
 * Email delivery status enum
 */
export type MessageStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced';

/**
 * Message/Email interface for user-to-user email communication
 */
export interface IMessage {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  recipients: Types.ObjectId[];
  cc?: Types.ObjectId[];
  bcc?: Types.ObjectId[];
  subject: string;
  body: string;
  bodyText?: string;
  attachments?: IAttachment[];
  status: MessageStatus;
  sendGridMessageId?: string;
  sentAt?: Date;
  scheduledFor?: Date;
  recipientStatuses: IRecipientStatus[];
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
  };
  errorMessage?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Instance methods available on Message documents
 */
export interface IMessageMethods {
  markAsReadByUser(userId: Types.ObjectId): Promise<IMessage>;
  markAsUnreadByUser(userId: Types.ObjectId): Promise<IMessage>;
  isReadByUser(userId: Types.ObjectId): boolean;
  updateStatus(newStatus: MessageStatus, errorMessage?: string): Promise<IMessage>;
  addRecipient(userId: Types.ObjectId, type?: 'to' | 'cc' | 'bcc'): Promise<IMessage>;
  canBeAccessedByUser(userId: Types.ObjectId): boolean;
  incrementRetryCount(): Promise<IMessage>;
}

/**
 * Query helpers for Message model
 * Note: Query helpers must extend the base query methods
 */
export interface IMessageQueryHelpers {
  byStatus(this: any, status: MessageStatus): any;
  bySender(this: any, senderId: Types.ObjectId): any;
  byRecipient(this: any, recipientId: Types.ObjectId): any;
  unreadByUser(this: any, userId: Types.ObjectId): any;
}
