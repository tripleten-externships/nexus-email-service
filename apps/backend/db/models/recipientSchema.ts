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
      //inquire about how we will track data
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

const Recipient: Model<IRecipientDocument> =
  mongoose.models.Recipient || mongoose.model<IRecipientDocument>('Recipient', recipientSchema);

// Instance methods

recipientSchema.methods.updateStatus = async function (newStatus: IRecipient['status']) {
  this.status = newStatus;
  return this.save();
};

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

//TODO: Static methods

export default Recipient;
