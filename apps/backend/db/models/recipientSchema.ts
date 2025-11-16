import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import validator from 'validator';
import {
  IRecipient,
  IRecipientMethods,
  IEngagementHistory,
  IRecipientQueryHelpers,
} from '../../../../packages/types/src/recipient';

type IRecipientDocument = IRecipient & Document & IRecipientMethods;

/**
 * Static methods for Recipient model
 */
interface IRecipientModel
  extends Model<IRecipientDocument, IRecipientQueryHelpers, IRecipientMethods> {
  findByEmail(email: string): Promise<IRecipientDocument | null>;
  findByStatus(status: IRecipient['status']): Promise<IRecipientDocument[]>;
  findByTag(tag: string): Promise<IRecipientDocument[]>;
  findByList(listId: Types.ObjectId): Promise<IRecipientDocument[]>;
  bulkAddToList(recipientIds: Types.ObjectId[], listId: Types.ObjectId): Promise<number>;
  bulkRemoveFromList(recipientIds: Types.ObjectId[], listId: Types.ObjectId): Promise<number>;
  getEngagedRecipients(minEngagementRate: number): Promise<IRecipientDocument[]>;
}

const recipientSchema = new Schema<IRecipientDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: (props: { value: string }) => `${props.value} is not a valid email address`,
      },
    },
    name: { type: String, trim: true },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'bounced'],
      default: 'subscribed',
      index: true,
      validate: {
        validator: (value: string) => ['subscribed', 'unsubscribed', 'bounced'].includes(value),
        message: (props: { value: string }) => `${props.value} is not a valid status`,
      },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    lists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'List',
      },
    ],
    engagementHistory: [
      {
        campaignId: {
          type: Schema.Types.ObjectId,
          ref: 'Campaign',
          required: true,
        },
        deliveredEmails: { type: Number, default: 0 },
        openedEmails: { type: Number, default: 0 },
        linksClicked: { type: Number, default: 0 },
        bouncedEmails: { type: Number, default: 0 },
        spamReports: { type: Number, default: 0 },
        unsubscribedAt: { type: Date },
        lastEngagedAt: { type: Date },
      },
    ],
    aggregateEngagement: {
      totalDelivered: { type: Number, default: 0 },
      totalOpened: { type: Number, default: 0 },
      totalClicked: { type: Number, default: 0 },
      totalBounced: { type: Number, default: 0 },
      totalSpamReports: { type: Number, default: 0 },
      totalUnsubscribed: { type: Number, default: 0 },
    },
    customAttributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
      validate: {
        validator: (value: Map<string, any>) => {
          return Array.from(value.values()).every(
            (v) => ['string', 'number', 'boolean'].includes(typeof v) || v === null
          );
        },
        message: () => `Custom attributes can only contain string, number, boolean, or null values`,
      },
    },
  },
  { timestamps: true }
);

// compound indexes for common queries
recipientSchema.index({ status: 1, tags: 1 });
recipientSchema.index({ email: 1, status: 1 });
recipientSchema.index({ lists: 1, status: 1 });
recipientSchema.index({ 'aggregateEngagement.totalOpened': -1 });
recipientSchema.index({ 'aggregateEngagement.totalDelivered': -1 });

// Virtual properties

/**
 * calculate engagement rate (opened/delivered)
 */
recipientSchema.virtual('engagementRate').get(function (this: IRecipientDocument) {
  if (!this.aggregateEngagement?.totalDelivered) return 0;
  return this.aggregateEngagement.totalOpened / this.aggregateEngagement.totalDelivered;
});

/**
 * calculate click-through rate (clicked/opened)
 */
recipientSchema.virtual('clickThroughRate').get(function (this: IRecipientDocument) {
  if (!this.aggregateEngagement?.totalOpened) return 0;
  return this.aggregateEngagement.totalClicked / this.aggregateEngagement.totalOpened;
});

/**
 * calculate bounce rate
 */
recipientSchema.virtual('bounceRate').get(function (this: IRecipientDocument) {
  if (!this.aggregateEngagement?.totalDelivered) return 0;
  return this.aggregateEngagement.totalBounced / this.aggregateEngagement.totalDelivered;
});

/**
 * check if recipient is engaged (>= 25% engagement rate)
 */
recipientSchema.virtual('isEngaged').get(function (this: IRecipientDocument) {
  return (this as any).engagementRate >= 0.25;
});

// Instance methods

/**
 * Update recipient status
 * @param newStatus - The new status to set
 * @returns The updated recipient document
 * @throws Error if save fails
 */
recipientSchema.methods.updateStatus = async function (
  this: IRecipientDocument,
  newStatus: IRecipient['status']
) {
  try {
    this.status = newStatus;
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to update status: ${(error as Error).message}`);
  }
};

/**
 * helper method to ensure lists is always an array
 */
recipientSchema.methods.ensureListsArray = function (this: IRecipientDocument) {
  this.lists = Array.isArray(this.lists) ? this.lists : [];
};

/**
 * add recipient to a list
 * @param listId - The list ID to add the recipient to
 * @returns The updated recipient document
 * @throws Error if save fails
 */
recipientSchema.methods.addToList = async function (
  this: IRecipientDocument,
  listId: mongoose.Types.ObjectId
) {
  try {
    this.ensureListsArray();
    const alreadyOnList = this.lists?.some((id: Types.ObjectId) => id.equals(listId));
    if (!alreadyOnList) {
      if (!this.lists) this.lists = [];
      this.lists.push(listId);
    }
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to add to list: ${(error as Error).message}`);
  }
};

/**
 * Remove recipient from a list
 * @param listId - The list ID to remove the recipient from
 * @returns The updated recipient document
 * @throws Error if save fails
 */
recipientSchema.methods.removeFromList = async function (
  this: IRecipientDocument,
  listId: mongoose.Types.ObjectId
) {
  try {
    this.ensureListsArray();
    this.lists = this.lists?.filter((id: Types.ObjectId) => !id.equals(listId)) || [];
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to remove from list: ${(error as Error).message}`);
  }
};

/**
 * Record an engagement event for a campaign
 * @param campaignId - The campaign ID
 * @param field - The engagement field to increment
 * @returns The updated recipient document
 * @throws Error if save fails
 */
recipientSchema.methods.recordEngagement = async function (
  this: IRecipientDocument,
  campaignId: mongoose.Types.ObjectId,
  field: keyof IEngagementHistory
) {
  try {
    // skip non-numeric fields
    if (field === 'campaignId' || field === 'unsubscribedAt' || field === 'lastEngagedAt') {
      throw new Error(`Cannot increment non-numeric field: ${field}`);
    }

    // find the matching campaign record inside engagementHistory
    const record = this.engagementHistory.find((r: IEngagementHistory) =>
      r.campaignId.equals(campaignId)
    );

    if (!record) {
      // if the campaign doesn't exist yet, create a new record
      const newRecord: any = {
        campaignId,
        deliveredEmails: 0,
        openedEmails: 0,
        linksClicked: 0,
        bouncedEmails: 0,
        spamReports: 0,
        lastEngagedAt: new Date(),
      };
      newRecord[field] = 1;
      this.engagementHistory.push(newRecord);
    } else {
      // if the campaign already exists, increment the field count
      const currentValue = (record[field] as number) || 0;
      (record[field] as number) = currentValue + 1;
      record.lastEngagedAt = new Date();
    }

    return await this.save();
  } catch (error) {
    throw new Error(`Failed to record engagement: ${(error as Error).message}`);
  }
};

/**
 * Update aggregate engagement totals based on engagement history
 * @returns The updated recipient document
 * @throws Error if save fails
 */
recipientSchema.methods.updateAggregateEngagement = async function (this: IRecipientDocument) {
  try {
    // initialize counters for all engagement types
    const totals = {
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalSpamReports: 0,
      totalUnsubscribed: 0,
    };

    // iterate through engagementHistory
    for (const record of this.engagementHistory) {
      totals.totalDelivered += record.deliveredEmails || 0;
      totals.totalOpened += record.openedEmails || 0;
      totals.totalClicked += record.linksClicked || 0;
      totals.totalBounced += record.bouncedEmails || 0;
      totals.totalSpamReports += record.spamReports || 0;
      if (record.unsubscribedAt) totals.totalUnsubscribed += 1;
    }

    // update and save new totals
    this.aggregateEngagement = totals;
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to update aggregate engagement: ${(error as Error).message}`);
  }
};

// Static methods

/**
 * Find a recipient by email address
 * @param email - The email address to search for
 * @returns The recipient document or null if not found
 */
recipientSchema.statics.findByEmail = async function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find all recipients with a specific status
 * @param status - The status to filter by
 * @returns Array of recipient documents
 */
recipientSchema.statics.findByStatus = async function (status: IRecipient['status']) {
  return this.find({ status });
};

/**
 * Find all recipients with a specific tag
 * @param tag - The tag to filter by
 * @returns Array of recipient documents
 */
recipientSchema.statics.findByTag = async function (tag: string) {
  return this.find({ tags: tag });
};

/**
 * Find all recipients in a specific list
 * @param listId - The list ID to filter by
 * @returns Array of recipient documents
 */
recipientSchema.statics.findByList = async function (listId: Types.ObjectId) {
  return this.find({ lists: listId });
};

/**
 * Add multiple recipients to a list at once
 * @param recipientIds - Array of recipient IDs to add
 * @param listId - The list ID to add them to
 * @returns Number of recipients updated
 */
recipientSchema.statics.bulkAddToList = async function (
  recipientIds: Types.ObjectId[],
  listId: Types.ObjectId
) {
  const result = await this.updateMany(
    { _id: { $in: recipientIds } },
    { $addToSet: { lists: listId } }
  );
  return result.modifiedCount;
};

/**
 * Remove multiple recipients from a list at once
 * @param recipientIds - Array of recipient IDs to remove
 * @param listId - The list ID to remove them from
 * @returns Number of recipients updated
 */
recipientSchema.statics.bulkRemoveFromList = async function (
  recipientIds: Types.ObjectId[],
  listId: Types.ObjectId
) {
  const result = await this.updateMany(
    { _id: { $in: recipientIds } },
    { $pull: { lists: listId } }
  );
  return result.modifiedCount;
};

/**
 * Get recipients with engagement rate above a threshold
 * @param minEngagementRate - Minimum engagement rate (0-1)
 * @returns Array of engaged recipient documents
 */
recipientSchema.statics.getEngagedRecipients = async function (minEngagementRate: number) {
  const recipients = await this.find({
    'aggregateEngagement.totalDelivered': { $gt: 0 },
  });

  return recipients.filter((recipient: IRecipientDocument) => {
    const rate =
      recipient.aggregateEngagement.totalOpened / recipient.aggregateEngagement.totalDelivered;
    return rate >= minEngagementRate;
  });
};

const Recipient =
  (mongoose.models.Recipient as IRecipientModel) ||
  mongoose.model<IRecipientDocument, IRecipientModel>('Recipient', recipientSchema);

export default Recipient;
