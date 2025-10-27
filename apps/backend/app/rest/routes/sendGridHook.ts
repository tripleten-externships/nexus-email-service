import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent, SQSHandler } from 'aws-lambda';
//import express and create variable for router and set it to express.router
import * as express from 'express'


/**
 * Returns a 200 response after parsing data in JSON
 * and inserting webhook data into collection
 * 
 * @param event - APIGatewayProxyEvent w/ body, headers,
 * HTTP method POST, and query string parameters
 * @returns Status 200 or 500
 */

const router = express.Router()

router.post('/webhook/sendgrid', async (req, res) => {
//Validates request and signatures(before processing)
    //Processes webhook events from email provider
    //Payload/APIGateway test:
    const events = req.body;
    // iterate through events
    // reduce the message down to the set of the fields we want in the event record
    // chunk messages into batches of <= 10 (max SQS batch size)
    // create array of promises, one for each batch (look into SendMessageBatchCommand from client-sqs package)
    // send current chunk of messages in batch
    // execute all send commands concurrently
    // process results for each batch
    try {
        // const payload = JSON.parse(event || '{}');
        // console.log(payload);
        return res.status(200).json()
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' })
    }
  })
    
    //Parses event logic for different events (open, clicks, bounces, etc.)
    //Includes SQS message processing
    //Integrates with EmailEvent model data (schema? to db here?)
    //Includes error handling and retry mechanisms
    //Includes CouldWatch logging and OpenTelemetry instrumentation




//Require POST URL for testing on Postman (make fake test?)

