import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SQSClientConfig,
} from '@aws-sdk/client-sqs';
import { createDefaultUserAgentProvider } from '@aws-sdk/util-user-agent-node';
import log from '../../../logging/log';
//import express and create variable for router and set it to express.router
import * as express from 'express';
import { SendGridEventMessage } from '../../types/sendGridEvents';

const router = express.Router();

const SQS_QUEUE_URL = process.env.SENDGRID_EVENTS_QUEUE_URL;
const CURRENT_AWS_REGION = process.env.CURRENT_AWS_REGION || 'us-east-1';
const isOffline = process.env.DEPLOYMENT_ENV === 'local';

async function createSqsClient() {
  const userAgent = await createDefaultUserAgentProvider({
    serviceId: 'nexus-sendgrid-hook',
    clientVersion: '3.435.0',
  })();

  const config: SQSClientConfig = {
    region: CURRENT_AWS_REGION,
    customUserAgent: userAgent,
  };

  // if running offline, override the endpoint to local ElasticMQ host
  if (isOffline) {
    config.endpoint = 'http://127.0.0.1:9324';
  }

  return new SQSClient(config);
}

const sqsClientPromise = createSqsClient();

//event properties to be used in message batches
const eventRecordProperties = [
  'event',
  'timestamp',
  'reason',
  'status',
  'ip',
  'url',
  'response',
  'sendId',
  'sg_event_id',
  'attempt',
];

//create a function that loops through each batch and accesses each batch
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Returns a 200 response after parsing data in JSON
 * and inserting webhook data into collection using SQS
 *
 * @returns Status 200 or 500
 */
router.post('/webhook/sendgrid', async (req, res) => {
  const events: SendGridEventMessage[] = req.body;
  let totalSuccessful = 0;
  let totalFailed = 0;

  if (!events || !Array.isArray(events)) {
    log.warn('Received invalid or empty events array from SendGrid.');
    return res.status(400).json({ error: 'Invalid events array' });
  }
  try {
    log.debug(`${JSON.stringify(req.body)}`);
    const sqsClient = await sqsClientPromise;

    // iterate through events
    const messages = events.map((event: SendGridEventMessage) => {
      log.info(`Processing event: ${JSON.stringify(event)}`);
      // reduce the message down to the set of the fields we want in the event record
      const record = eventRecordProperties.reduce(
        (rec, field) => {
          if (event[field]) {
            rec[field] = event[field];
          }
          return rec;
        },
        {} as Record<string, any>
      );
      const eventId = event.sg_event_id;
      return {
        Id: eventId,
        MessageBody: JSON.stringify(record),
        MessageDeduplicationId: eventId,
        MessageGroupId: 'SendGridEvents',
      };
    });

    // chunk messages into batches of <= 10 (max SQS batch size)
    const batches = chunkArray(messages, 10);

    log.debug(`Checking batches: ${JSON.stringify(batches)}`);
    //create array of promises, one for each batch
    const promises = batches.map((chunk) => {
      const sendCommand = new SendMessageBatchCommand({
        QueueUrl: SQS_QUEUE_URL,
        Entries: chunk,
      });
      //send current chunk of messages in batch
      return sqsClient.send(sendCommand);
    });
    // execute all send commands concurrently
    const results = await Promise.allSettled(promises);

    // process the results of each batch
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const response: SendMessageBatchCommandOutput = result.value;
        if (response.Successful) {
          totalSuccessful += response.Successful.length;
        }
        if (response.Failed && response.Failed.length > 0) {
          totalFailed += response.Failed.length;
          log.warn(`Failed to send batch of ${response.Failed.length} messages: `, response.Failed);
        }
      } else {
        // if the promise was rejected, count entire batch as failed
        totalFailed += 1;
        log.error('Error sending batch: ', result.reason);
      }
    });

    log.info(
      `Processed and sent ${totalSuccessful} SendGrid mail delivery events to SQS. Total failures: ${totalFailed}.`
    );
  } catch (error) {
    log.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(200).json('success');
});

export default router;
