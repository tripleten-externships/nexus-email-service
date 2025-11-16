import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import validator from 'validator';
import {
  IMessage,
  IMessageMethods,
  IMessageQueryHelpers,
  IAttachment,
  IRecipientStatus,
  MessageStatus,
} from '../../../../packages/types/src/message';

type IMessageDocument = IMessage & Document & IMessageMethods;

/**
 * Static methods for Message model
 */
interface IMessageModel extends Model<IMessageDocument, IMessageQueryHelpers, IMessageMethods> {
  findBySender(senderId: Types.ObjectId, options?: PaginationOptions): Promise<IMessageDocument[]>;
  findByRecipient(
    recipientId: Types.ObjectId,
    options?: PaginationOptions
  ): Promise<IMessageDocument[]>;
  findByStatus(status: MessageStatus): Promise<IMessageDocument[]>;
  findUnreadByUser(userId: Types.ObjectId): Promise<IMessageDocument[]>;
  findInboxForUser(
    userId: Types.ObjectId,
    options?: PaginationOptions
  ): Promise<PaginatedResult<IMessageDocument>>;
  findSentByUser(
    userId: Types.ObjectId,
    options?: PaginationOptions
  ): Promise<PaginatedResult<IMessageDocument>>;
  findDraftsByUser(userId: Types.ObjectId): Promise<IMessageDocument[]>;
  countUnreadByUser(userId: Types.ObjectId): Promise<number>;
}

/**
 * Pagination options
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Attachment sub-schema
 */
const attachmentSchema = new Schema<IAttachment>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: 10 * 1024 * 1024, // 10MB max per attachment
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || validator.isURL(v),
        message: 'Invalid URL',
      },
    },
    content: {
      type: String,
    },
    disposition: {
      type: String,
      enum: ['attachment', 'inline'],
      default: 'attachment',
    },
  },
  { _id: false }
);

/**
 * Recipient status sub-schema
 */
const recipientStatusSchema = new Schema<IRecipientStatus>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * Message schema
 */
const messageSchema = new Schema<
  IMessageDocument,
  IMessageModel,
  IMessageMethods,
  IMessageQueryHelpers
>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    cc: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bcc: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 998, // RFC 2822 recommendation
      index: 'text',
    },
    body: {
      type: String,
      required: true,
      maxlength: 500000, // ~500KB for HTML body
    },
    bodyText: {
      type: String,
      maxlength: 500000,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'bounced'],
      default: 'draft',
      required: true,
      index: true,
    },
    sendGridMessageId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    scheduledFor: {
      type: Date,
      index: true,
    },
    recipientStatuses: [recipientStatusSchema],
    metadata: {
      ipAddress: {
        type: String,
        validate: {
          validator: (v: string) => !v || validator.isIP(v),
          message: 'Invalid IP address',
        },
      },
      userAgent: String,
      deviceInfo: String,
    },
    errorMessage: {
      type: String,
      maxlength: 1000,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lastRetryAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
messageSchema.index({ sender: 1, sentAt: -1 });
messageSchema.index({ recipients: 1, sentAt: -1 });
messageSchema.index({ status: 1, scheduledFor: 1 });
messageSchema.index({ status: 1, sentAt: -1 });
messageSchema.index({ sendGridMessageId: 1 }, { sparse: true });
messageSchema.index({ 'recipientStatuses.userId': 1, 'recipientStatuses.isRead': 1 });

// Text index for search functionality (future enhancement)
messageSchema.index({ subject: 'text', bodyText: 'text' });

// Validation: ensure at least one recipient
messageSchema.pre('validate', function (next) {
  const totalRecipients =
    (this.recipients?.length || 0) + (this.cc?.length || 0) + (this.bcc?.length || 0);

  if (totalRecipients === 0 && this.status !== 'draft') {
    return next(new Error('At least one recipient is required for non-draft messages'));
  }

  // Validate total attachment size
  if (this.attachments && this.attachments.length > 0) {
    const totalSize = this.attachments.reduce((sum, att) => sum + att.size, 0);
    const maxTotalSize = 25 * 1024 * 1024; // 25MB total (SendGrid limit)
    if (totalSize > maxTotalSize) {
      return next(new Error('Total attachment size exceeds 25MB limit'));
    }
  }

  next();
});

// Pre-save hook to initialize recipientStatuses
messageSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('recipients') || this.isModified('cc')) {
    const allRecipients = [
      ...(this.recipients || []),
      ...(this.cc || []),
      // Note: BCC recipients are not added to recipientStatuses for privacy
    ];

    // Initialize recipientStatuses for new recipients
    const existingUserIds = this.recipientStatuses.map((rs) => rs.userId.toString());

    allRecipients.forEach((recipientId) => {
      const recipientIdStr = recipientId.toString();
      if (!existingUserIds.includes(recipientIdStr)) {
        this.recipientStatuses.push({
          userId: recipientId,
          isRead: false,
        });
      }
    });
  }

  next();
});

// Virtual properties

/**
 * Check if message has been read by all recipients
 */
messageSchema.virtual('isReadByAll').get(function (this: IMessageDocument) {
  if (!this.recipientStatuses || this.recipientStatuses.length === 0) {
    return false;
  }
  return this.recipientStatuses.every((rs) => rs.isRead);
});

/**
 * Count of unread recipients
 */
messageSchema.virtual('unreadCount').get(function (this: IMessageDocument) {
  if (!this.recipientStatuses || this.recipientStatuses.length === 0) {
    return 0;
  }
  return this.recipientStatuses.filter((rs) => !rs.isRead).length;
});

/**
 * Total number of recipients (to, cc, bcc)
 */
messageSchema.virtual('totalRecipients').get(function (this: IMessageDocument) {
  return (this.recipients?.length || 0) + (this.cc?.length || 0) + (this.bcc?.length || 0);
});

/**
 * Check if message has attachments
 */
messageSchema.virtual('hasAttachments').get(function (this: IMessageDocument) {
  return this.attachments && this.attachments.length > 0;
});

// Instance Methods

/**
 * Mark message as read by a specific user
 * @param userId - The user ID marking the message as read
 * @returns The updated message document
 */
messageSchema.methods.markAsReadByUser = async function (
  this: IMessageDocument,
  userId: Types.ObjectId
) {
  const status = this.recipientStatuses.find((rs) => rs.userId.equals(userId));

  if (status && !status.isRead) {
    status.isRead = true;
    status.readAt = new Date();
    return await this.save();
  }

  return this;
};

/**
 * Mark message as unread by a specific user
 * @param userId - The user ID marking the message as unread
 * @returns The updated message document
 */
messageSchema.methods.markAsUnreadByUser = async function (
  this: IMessageDocument,
  userId: Types.ObjectId
) {
  const status = this.recipientStatuses.find((rs) => rs.userId.equals(userId));

  if (status && status.isRead) {
    status.isRead = false;
    status.readAt = undefined;
    return await this.save();
  }

  return this;
};

/**
 * Check if message is read by a specific user
 * @param userId - The user ID to check
 * @returns True if read, false otherwise
 */
messageSchema.methods.isReadByUser = function (
  this: IMessageDocument,
  userId: Types.ObjectId
): boolean {
  const status = this.recipientStatuses.find((rs) => rs.userId.equals(userId));
  return status ? status.isRead : false;
};

/**
 * Update message status
 * @param newStatus - The new status
 * @param errorMessage - Optional error message if status is 'failed'
 * @returns The updated message document
 */
messageSchema.methods.updateStatus = async function (
  this: IMessageDocument,
  newStatus: MessageStatus,
  errorMessage?: string
) {
  this.status = newStatus;

  if (newStatus === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }

  if (errorMessage) {
    this.errorMessage = errorMessage;
  }

  return await this.save();
};

/**
 * Add a recipient to the message
 * @param userId - The user ID to add
 * @param type - The recipient type (to, cc, bcc)
 * @returns The updated message document
 */
messageSchema.methods.addRecipient = async function (
  this: IMessageDocument,
  userId: Types.ObjectId,
  type: 'to' | 'cc' | 'bcc' = 'to'
) {
  const userIdStr = userId.toString();

  // Check if user is already a recipient
  const isAlreadyRecipient =
    this.recipients?.some((id) => id.toString() === userIdStr) ||
    this.cc?.some((id) => id.toString() === userIdStr) ||
    this.bcc?.some((id) => id.toString() === userIdStr);

  if (isAlreadyRecipient) {
    return this;
  }

  // Add to appropriate array
  switch (type) {
    case 'to':
      if (!this.recipients) this.recipients = [];
      this.recipients.push(userId);
      break;
    case 'cc':
      if (!this.cc) this.cc = [];
      this.cc.push(userId);
      break;
    case 'bcc':
      if (!this.bcc) this.bcc = [];
      this.bcc.push(userId);
      break;
  }

  return await this.save();
};

/**
 * Check if a user can access this message (sender or recipient)
 * @param userId - The user ID to check
 * @returns True if user can access, false otherwise
 */
messageSchema.methods.canBeAccessedByUser = function (
  this: IMessageDocument,
  userId: Types.ObjectId
): boolean {
  const userIdStr = userId.toString();

  // Check if user is the sender
  if (this.sender.toString() === userIdStr) {
    return true;
  }

  // Check if user is a recipient (to, cc, or bcc)
  return (
    this.recipients?.some((id) => id.toString() === userIdStr) ||
    this.cc?.some((id) => id.toString() === userIdStr) ||
    this.bcc?.some((id) => id.toString() === userIdStr) ||
    false
  );
};

/**
 * Increment retry count and update last retry timestamp
 * @returns The updated message document
 */
messageSchema.methods.incrementRetryCount = async function (this: IMessageDocument) {
  this.retryCount = (this.retryCount || 0) + 1;
  this.lastRetryAt = new Date();
  return await this.save();
};

// Static Methods

/**
 * Find messages by sender
 * @param senderId - The sender's user ID
 * @param options - Pagination options
 * @returns Array of message documents
 */
messageSchema.statics.findBySender = async function (
  senderId: Types.ObjectId,
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 20, sortBy = 'sentAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  return this.find({ sender: senderId })
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('recipients', 'name email')
    .populate('cc', 'name email')
    .populate('sender', 'name email');
};

/**
 * Find messages by recipient
 * @param recipientId - The recipient's user ID
 * @param options - Pagination options
 * @returns Array of message documents
 */
messageSchema.statics.findByRecipient = async function (
  recipientId: Types.ObjectId,
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 20, sortBy = 'sentAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  return this.find({
    $or: [{ recipients: recipientId }, { cc: recipientId }, { bcc: recipientId }],
    status: { $in: ['sent', 'delivered'] },
  })
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name email')
    .populate('recipients', 'name email')
    .populate('cc', 'name email');
};

/**
 * Find messages by status
 * @param status - The message status
 * @returns Array of message documents
 */
messageSchema.statics.findByStatus = async function (status: MessageStatus) {
  return this.find({ status });
};

/**
 * Find unread messages for a user
 * @param userId - The user ID
 * @returns Array of unread message documents
 */
messageSchema.statics.findUnreadByUser = async function (userId: Types.ObjectId) {
  return this.find({
    $or: [{ recipients: userId }, { cc: userId }, { bcc: userId }],
    status: { $in: ['sent', 'delivered'] },
    'recipientStatuses.userId': userId,
    'recipientStatuses.isRead': false,
  })
    .sort({ sentAt: -1 })
    .populate('sender', 'name email');
};

/**
 * Find inbox messages for a user with pagination
 * @param userId - The user ID
 * @param options - Pagination options
 * @returns Paginated result with messages
 */
messageSchema.statics.findInboxForUser = async function (
  userId: Types.ObjectId,
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 20, sortBy = 'sentAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const query = {
    $or: [{ recipients: userId }, { cc: userId }, { bcc: userId }],
    status: { $in: ['sent', 'delivered'] },
  };

  const [data, total] = await Promise.all([
    this.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .populate('cc', 'name email'),
    this.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Find sent messages by a user with pagination
 * @param userId - The user ID
 * @param options - Pagination options
 * @returns Paginated result with messages
 */
messageSchema.statics.findSentByUser = async function (
  userId: Types.ObjectId,
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 20, sortBy = 'sentAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const query = {
    sender: userId,
    status: { $in: ['sent', 'delivered', 'failed', 'bounced'] },
  };

  const [data, total] = await Promise.all([
    this.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('recipients', 'name email')
      .populate('cc', 'name email'),
    this.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Find draft messages by a user
 * @param userId - The user ID
 * @returns Array of draft message documents
 */
messageSchema.statics.findDraftsByUser = async function (userId: Types.ObjectId) {
  return this.find({ sender: userId, status: 'draft' })
    .sort({ updatedAt: -1 })
    .populate('recipients', 'name email')
    .populate('cc', 'name email');
};

/**
 * Count unread messages for a user
 * @param userId - The user ID
 * @returns Count of unread messages
 */
messageSchema.statics.countUnreadByUser = async function (userId: Types.ObjectId) {
  return this.countDocuments({
    $or: [{ recipients: userId }, { cc: userId }, { bcc: userId }],
    status: { $in: ['sent', 'delivered'] },
    'recipientStatuses.userId': userId,
    'recipientStatuses.isRead': false,
  });
};

// Query helpers
messageSchema.query.byStatus = function (status: MessageStatus) {
  return this.find({ status });
};

messageSchema.query.bySender = function (senderId: Types.ObjectId) {
  return this.find({ sender: senderId });
};

messageSchema.query.byRecipient = function (recipientId: Types.ObjectId) {
  return this.find({
    $or: [{ recipients: recipientId }, { cc: recipientId }, { bcc: recipientId }],
  });
};

messageSchema.query.unreadByUser = function (userId: Types.ObjectId) {
  return this.find({
    $or: [{ recipients: userId }, { cc: userId }, { bcc: userId }],
    'recipientStatuses.userId': userId,
    'recipientStatuses.isRead': false,
  });
};

const MessageModel =
  (mongoose.models.Message as IMessageModel) ||
  mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);

export default MessageModel;
export type { IMessageDocument, IMessageModel, PaginationOptions, PaginatedResult };
