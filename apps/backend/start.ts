import * as http from 'http';
import { connection } from 'mongoose';
import app from './app/app';
import initializeDBConnection from './db/db';

require('dotenv').config();

const debug = require('debug')('server:server');

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (val: string): string | number | boolean => {
  const testPort = parseInt(val, 10);

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
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
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

const onListening = async (): Promise<void> => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr ? addr?.port : ''}`;
  debug(`Listening on ${bind}`);

  // initialize DB connection when server starts
  try {
    await initializeDBConnection({ runServerless: true });
    console.log('Database connection initialized');
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
};

/**
 * Event listener for HTTP server "close" event.
 */
const exitHandler = async (signal: string): Promise<void> => {
  console.log(`${signal} detected. Closing DB connections...`);
  if (connection) {
    await connection.close();
  }

  console.log('Bye bye!');
  process.exit();
};

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', () => {
  onListening().catch((err) => console.error('Error in onListening handler:', err));
});

process.on('uncaughtException', async (): Promise<void> => {
  await exitHandler('uncaughtException');
});

process.on('SIGTERM', async (): Promise<void> => {
  await exitHandler('SIGTERM');
});

process.on('SIGINT', async (): Promise<void> => {
  await exitHandler('SIGINT');
});
