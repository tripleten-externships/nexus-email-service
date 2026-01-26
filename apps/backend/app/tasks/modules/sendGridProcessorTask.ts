import {
  SendMessageCommand,
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  Message,
  MessageAttributeValue,
} from '@aws-sdk/client-sqs';

import {
  Context,
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSHandler,
  SQSRecord,
} from 'aws-lambda';
import log from '../../../logging/log';
// import RecipientModel from '../../models/recipientModel';
// import { eventRecordProperties, SendGridDeliveryEvents, SendGridEventType } from '../../types/sendGridEvents';

const SQS_QUEUE_URL = process.env.SENDGRID_EVENTS_QUEUE_URL;
const ACTIVE_AWS_REGION = process.env.ACTIVE_AWS_REGION || 'us-east-1';
const POLL_WAIT_MS = 60000;

const isOffline = process.env.DEPLOYMENT_ENV === 'local';

const sqsClient = new SQSClient({
  region: ACTIVE_AWS_REGION,
  ...(isOffline && { endpoint: 'http://127.0.0.1:9324' }), // if running offline, override the endpoint to local ElasticMQ host
});

function convertToMessage(record: SQSRecord): Message {
  const messageAttributes: Record<string, MessageAttributeValue> = {};

  if (record.messageAttributes) {
    for (const key of Object.keys(record.messageAttributes ?? {})) {
      const attribute = record.messageAttributes[key];

      messageAttributes[key] = {
        StringValue: attribute.stringValue,
        BinaryValue: attribute.binaryValue as any,
        StringListValues: attribute.stringListValues,
        BinaryListValues: attribute.binaryListValues as any,
        DataType: attribute.dataType,
      };
    }
  }

  return {
    MessageId: record.messageId,
    ReceiptHandle: record.receiptHandle,
    MD5OfBody: record.md5OfBody,
    Body: record.body,
    Attributes: record.attributes,
    MD5OfMessageAttributes: record.md5OfMessageAttributes,
    MessageAttributes: messageAttributes,
  };
}

const processBatch = async (messages: Message[], failures: SQSBatchItemFailure[]) => {
  // this is the stub for the actual processing of the messages
  const params = {
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: JSON.stringify(messages),
    MessageGroupId: 'emails',
  };

  for (const message of messages) {
    try {
      console.log('Handling message', message.MessageId);
      await sqsClient.send(new SendMessageCommand(params));
    } catch (err) {
      console.error('Failed message: ', message.MessageId, err);
      failures.push({ itemIdentifier: message.MessageId! });
    }
  }
};

// helper function for local use to simulate Lambda polling and processing of the messages
const pollAndProcess = async (
  failures: SQSBatchItemFailure[],
  startTime: number = Date.now()
): Promise<void> => {
  if (Date.now() - startTime >= 5 * 60 * 1000) {
    log.info('Polling stopped after 5 minutes.');
    return Promise.resolve();
  }
  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: SQS_QUEUE_URL!,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
    AttributeNames: ['All'],
    MessageAttributeNames: ['All'],
  });

  return sqsClient.send(receiveCommand).then((response) => {
    if (response.Messages && response.Messages.length > 0) {
      log.info(`Polled ${response.Messages.length} additional messages.`);
      return processBatch(response.Messages, failures).then(() =>
        pollAndProcess(failures, startTime)
      );
    }
    log.info(`No messages found. Waiting ${POLL_WAIT_MS}ms before next poll.`);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        pollAndProcess(failures, startTime).then(resolve);
      }, POLL_WAIT_MS);
    });
  });
};

// stub for the actual handler. expected to return Promise<SQSBatchResponse>
const handler: SQSHandler = async (event: SQSEvent, ctx: Context): Promise<SQSBatchResponse> => {
  const failures: SQSBatchItemFailure[] = [];
  if (ctx) {
    ctx.callbackWaitsForEmptyEventLoop = false;
  }
  try {
    const messages: Message[] = event.Records.map(convertToMessage);
    await processBatch(messages, failures);
    log.info('Processing SQS event');
  } catch (error) {
    log.error('Error processing SQS event:', error);
  } finally {
    if (sqsClient) {
      sqsClient.destroy();
    }
  }
  const response: SQSBatchResponse = {
    batchItemFailures: failures,
  };
  return response;
};

export default handler;
