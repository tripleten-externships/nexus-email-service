/**
 * Serverless
 */
import { createServer, proxy } from 'aws-serverless-express';
import dotenv from 'dotenv';
import app from './app/app';

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
  // eslint-disable-next-line no-console
  console.log('SIGINT detected. Exiting... Bye!');
  process.exit(1);
});
process.on('uncaughtException', (): void => {
  // eslint-disable-next-line no-console
  console.log('uncaughtException. Exiting... Bye!');
  process.exit(2);
});
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.log('Unhandled Rejection:');
  // eslint-disable-next-line no-console
  console.log(reason);
  process.exit(3);
});
