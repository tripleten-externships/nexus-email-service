import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';
import { IRecipient } from '../../../../packages/types/src/recipient';

type IRecipientDocument = Omit<IRecipient, '_id'> & Document;

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
        message: (props: any) => `${props.value} is not a valid email address`,
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
        message: (props: any) => `${props.value} is not a valid status`,
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

// Instance methods

recipientSchema.methods.updateStatus = async function (newStatus: IRecipient['status']) {
  this.status = newStatus;
  return this.save();
};

// Helper method
recipientSchema.methods.ensureListsArray = function () {
  // ensures lists is always an array
  this.lists = Array.isArray(this.lists) ? this.lists : [];
};

recipientSchema.methods.addToList = async function (listId: mongoose.Types.ObjectId) {
  this.ensureListsArray();
  const alreadyOnList = this.lists.some((id: mongoose.Types.ObjectId) => id.equals(listId));
  if (!alreadyOnList) this.lists.push(listId);
  return this.save();
};

recipientSchema.methods.removeFromList = async function (listId: mongoose.Types.ObjectId) {
  this.ensureListsArray();
  this.lists = this.lists.filter((id: mongoose.Types.ObjectId) => !id.equals(listId));
  return this.save();
};

// updates engagement totals based on engagementHistory (to be called after modifying engagementHistory)
recipientSchema.methods.updateAggregateEnagement = async function () {
  // initialize counters for all engagement types
  const totals = {
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalSpamReports: 0,
    totalUnsubscribed: 0,
  };
  // loop through engagementHistory
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
  return this.save();
};

//hold off: Static methods

const Recipient: Model<IRecipientDocument> =
  mongoose.models.Recipient || mongoose.model<IRecipientDocument>('Recipient', recipientSchema);

export default Recipient;
