import * as http from 'http';
import { connection } from 'mongoose';
import app from './app/app';

require('dotenv').config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('server:server');

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (val: string): string | number | boolean => {
  const testPort = parseInt(val, 10);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(testPort)) {
    // named pipe
    return val;
  }

  if (testPort >= 0) {
    // port number
    return testPort;
  }

  return false;
};

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '7777');

// eslint-disable-next-line no-console
console.log(`Listening on port ${port}`);

app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (error): void => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      // eslint-disable-next-line no-console
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // eslint-disable-next-line no-console
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = (): void => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr ? addr?.port : ''}`;
  debug(`Listening on ${bind}`);
};

/**
 * Event listener for HTTP server "close" event.
 */
const exitHandler = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`${signal} detected. Closing DB connections...`);
  if (connection) {
    await connection.close();
  }
  // eslint-disable-next-line no-console
  console.log('Bye bye!');
  process.exit();
};

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

process.on('uncaughtException', async (): Promise<void> => {
  await exitHandler('uncaughtException');
});

process.on('SIGTERM', async (): Promise<void> => {
  await exitHandler('SIGTERM');
});

process.on('SIGINT', async (): Promise<void> => {
  await exitHandler('SIGINT');
});
