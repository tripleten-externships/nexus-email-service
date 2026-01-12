/**
 * Serverless
 */
import { createServer, proxy } from 'aws-serverless-express';
import dotenv from 'dotenv';
import app from './app/app';

// task handlers
import mainHandler from './app/tasks/handlers/mainHandler';
import runnerHandler from './app/tasks/handlers/runnerHandler';
import processSendGridEventsTask from './app/tasks/modules/sendGridProcessorTask';

// import task modules to register them
import './app/tasks/modules/sendGridProcessorTask';

dotenv.config();

const server = createServer(app);

server.setTimeout(25 * 1000); // 25 Seconds

exports.handler = (event, context) => {
  // From the MongoDB docs:
  // The following line is critical for performance reasons to allow re-use of database
  // connections across calls to this Lambda function and avoid closing the database connection.
  // The first call to this lambda function takes about 5 seconds to complete, while subsequent,
  // close calls will only take a few hundred milliseconds.
  context.callbackWaitsForEmptyEventLoop = false;

  proxy(server, event, context);
};

process.on('SIGINT', (): void => {
  console.log('SIGINT detected. Exiting... Bye!');
  process.exit(1);
});
process.on('uncaughtException', (): void => {
  console.log('uncaughtException. Exiting... Bye!');
  process.exit(2);
});
process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection:');

  console.log(reason);
  process.exit(3);
});

// Export task scheduler handlers
exports.mainHandler = (event, context, callback) => {
  return mainHandler(event, context, callback);
};

exports.runnerHandler = (event, context, callback) => {
  return runnerHandler(event, context, callback);
};

// hand SQS handler function directly to AWS for proper handling
// of SQS message deletion based on batchItemFailures
exports.processSendGridEventsTask = processSendGridEventsTask;
