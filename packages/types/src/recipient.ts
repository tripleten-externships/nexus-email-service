import { Types } from 'mongoose';

export interface IRecipient {
  _id?: Types.ObjectId;
  email: string;
  name?: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  tags?: string[];
  lists?: Types.ObjectId[];
  engagementHistory: {
    campaignId: Types.ObjectId;
    openedEmails: number;
    linksClicked: number;
    lastEngagedAt: Date;
  }[];
  customAttributes: Record<string, string | number | boolean | null>;
  //ask about adding createdAt/updatedAt timestamps types
}
