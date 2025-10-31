import mongoose, { Types } from 'mongoose';

export interface IRecipient {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  tags?: string[];
  lists?: Types.ObjectId[];
  engagementHistory: [
    {
      campaignId: Types.ObjectId;
      openedEmails: number;
      linksClicked: number;
      deliveredEmails: number;
      bouncedEmails: number;
      unsubscribedAt: Date;
      spamReports: number;
      lastEngagedAt: Date;
    },
  ];
  aggregateEngagement: [
    {
      totalDelivered: number;
      totalOpened: number;
      totalClicked: number;
      totalBounced: number;
      totalSpamReports: number;
      totalUnsubscribed: number;
    },
  ];
  customAttributes: Record<string, string | number | boolean | null>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecipientMethods {
  updateStatus(newStatus: IRecipient['status']): Promise<IRecipient>;
  ensureListsArray(): void;
  addToList(listId: Types.ObjectId): Promise<IRecipient>;
  removeFromList(listId: Types.ObjectId): Promise<IRecipient>;
  updateAggregateEngagement(): Promise<IRecipient>;
  recordEngagement(
    campaignId: Types.ObjectId,
    field: keyof IRecipient['engagementHistory'][0]
  ): Promise<IRecipient>;
}
