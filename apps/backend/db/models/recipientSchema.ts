import mongoose, { Schema, Document, Model } from 'mongoose';
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
    },
    name: { type: String, trim: true },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'bounced'],
      default: 'subscribed',
      index: true,
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
        openedEmails: { type: Number, default: 0 },
        linksClicked: { type: Number, default: 0 },
        lastEngagedAt: { type: Date },
      },
    ],
    customAttributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Recipient: Model<IRecipientDocument> =
  mongoose.models.Recipient || mongoose.model<IRecipientDocument>('Recipient', recipientSchema);

export default Recipient;
