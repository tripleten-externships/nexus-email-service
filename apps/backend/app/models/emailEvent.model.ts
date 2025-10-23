import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailEvent extends Document {
  messageId: Number;
  recipientEmail: String;
  eventType: String;
  timestamp: Date;
  ipAddress: String;
  userAgent: String;
  geoLocationData: String;
}

const EmailEventSchema: Schema<IEmailEvent> = new Schema<IEmailEvent>({});

export const User: Model<IEmailEvent> = mongoose.model<IEmailEvent>('EmailEvent', EmailEventSchema);
