import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import log from '../../../logging/log';
//import express and create variable for router and set it to express.router
import * as express from 'express';

/**
 * Returns a 200 response after parsing data in JSON
 * and inserting webhook data into collection using SQS
 *
 * @returns Status 200 or 500
 */

const router = express.Router();

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

router.post('/webhook/sendgrid', async (req, res) => {
  try {
    log.debug(`${JSON.stringify(req.body)}`);
    const events = JSON.parse(req.body);
    // iterate through events
    // reduce the message down to the set of the fields we want in the event record

    const messages = events.map((event) => {
      log.info(`Processing event: ${JSON.stringify(event)}`);
      // reduce the message down to just the set of fields we want in the EventRecord
      const record = eventRecordProperties.reduce((rec, field) => {
        if (event[field]) {
          rec[field] = event[field];
        }
        return rec;
      }, {});
      const eventId = event.sg_event_id;
      return {
        Id: eventId,
        MessageBody: JSON.stringify(record),
        MessageDeduplicationId: eventId,
        MessageGroupId: 'SendGridEvents',
      };
    });

    log.debug(`${messages}`);
    // chunk messages into batches of <= 10 (max SQS batch size)
    const batchSize = 0;
    const batches: (typeof messages)[][] = []; //an array of arrays
    for (let i = 0; i < messages.length; i += batchSize) {
      //create batches of 10
      batches.push(messages.slice(i, i + batchSize));
    }

    //create a function that loops through each batch and accesses each batch
    // create array of promises, one for each batch (look into SendMessageBatchCommand from client-sqs package)
    // send current chunk of messages in batch
    log.debug(`${batches}`);
    const config = {};
    const client = new SQSClient(config);
    const promises = batches.map((batch) => {
      return client.send(
        new SendMessageBatchCommand({
          QueueUrl: 'http://127.0.0.1:9324/queue/SendGridLocalQueue.fifo', //what URL and how to access it
          Entries: batch,
        })
      );
    });

    const results = Promise.allSettled(promises);

    // execute all send commands concurrently

    return res.status(200).json();
  } catch (error) {
    log.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
