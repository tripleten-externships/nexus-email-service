/**
  events returned by sendgrid (via webhook)

  @see https://sendgrid.com/docs/for-developers/tracking-events/event/#events
*/
export enum SendGridEventType {
  // nexus email service types (not defined by sendgrid)
  QUEUED = 'queued', // activity created, but not sent to sendgrid
  TRANSMITTED = 'transmitted', // email sent to sendgrid

  // delivery
  PROCESSED = 'processed',
  DROPPED = 'dropped',
  DELIVERED = 'delivered',
  DEFERRED = 'deferred',
  BOUNCE = 'bounce',

  // engagement
  OPEN = 'open',
  CLICK = 'click',
  SPAM_REPORT = 'spamreport',
  UNSUBSCRIBE = 'unsubscribe',
  GROUP_UNSUBSCRIBE = 'group_unsubscribe', // not used
  GROUP_RESUBSCRIBE = 'group_resubscribe', // not used
}

export const SendGridDeliveryEvents = [
  SendGridEventType.PROCESSED,
  SendGridEventType.DELIVERED,
  SendGridEventType.DROPPED,
  SendGridEventType.DEFERRED,
  SendGridEventType.BOUNCE,
];

/**
  record containing relevant information sent by sendgrid events webhook
  note that this does not include all data that is transmitted, but rather
  the data we need

  @see https://sendgrid.com/docs/for-developers/tracking-events/event/#json-objects
*/

export interface SendGridEventRecord {
  event: SendGridEventType;
  timestamp: Date;
  reason?: string; // used for some delivery events
  status?: string; // used for some delivery events
  ip?: string; // used by open and click events
  url?: string; // used by click events
}

// an extended version of the record that includes info passed by sendgrid that we do not want to store
export interface SendGridEventMessage extends SendGridEventRecord {
  sendId: string; // _id sent to sendgrid to identify the email
  sg_event_id?: string; // unique identifier for the event
}
