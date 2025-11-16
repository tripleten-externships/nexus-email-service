import mongoose, { Types } from 'mongoose';

/**
 * Engagement history entry for a single campaign
 */
export interface IEngagementHistory {
  campaignId: Types.ObjectId;
  openedEmails: number;
  linksClicked: number;
  deliveredEmails: number;
  bouncedEmails: number;
  unsubscribedAt?: Date;
  spamReports: number;
  lastEngagedAt?: Date;
}

/**
 * Aggregate engagement metrics across all campaigns
 */
export interface IAggregateEngagement {
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalSpamReports: number;
  totalUnsubscribed: number;
}

/**
 * Recipient/Contact interface for email management
 */
export interface IRecipient {
  _id?: Types.ObjectId;
  email: string;
  name?: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  tags?: string[];
  lists?: Types.ObjectId[];
  engagementHistory: IEngagementHistory[];
  aggregateEngagement: IAggregateEngagement;
  customAttributes: Record<string, string | number | boolean | null>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Instance methods available on Recipient documents
 */
export interface IRecipientMethods {
  updateStatus(newStatus: IRecipient['status']): Promise<IRecipient>;
  ensureListsArray(): void;
  addToList(listId: Types.ObjectId): Promise<IRecipient>;
  removeFromList(listId: Types.ObjectId): Promise<IRecipient>;
  updateAggregateEngagement(): Promise<IRecipient>;
  recordEngagement(
    campaignId: Types.ObjectId,
    field: keyof IEngagementHistory
  ): Promise<IRecipient>;
}

/**
 * Query helpers for Recipient model
 */
export interface IRecipientQueryHelpers {
  byStatus(status: IRecipient['status']): any;
  byTag(tag: string): any;
}
