import { MongoNetworkError } from 'mongodb';
import { connect, connection, ConnectOptions } from 'mongoose';
import { mongooseLazyConnect } from 'mongoose-lazy-connect';
import { getSSMParameterValue } from '../utils/ssmParameters';
import log from '../logging/log';

// As "connection" is in the global scope, Lambda may retain it between
// function calls thanks to "callbackWaitsForEmptyEventLoop" in the serverless.ts file.

let isConnected = false;
let testRun = false;

/**
 * Resolve the MongoDB URL. If one cannot be found, an error is thrown.
 */
const resolveMongoURL = async (mongoUri?: string): Promise<string> => {
  if (mongoUri) {
    return mongoUri;
  }

  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }

  const mongoURL = await resolveMongoURLFromSSM();

  if (!mongoURL) {
    throw new Error('No MongoDB URL found');
  }

  return mongoURL;
};

const resolveMongoURLFromSSM = async () => {
  const ssmParamName = process.env.MONGO_SSM_PARAM || '';
  if (!ssmParamName) {
    throw new Error('No MongoDB URL found');
  }

  try {
    return await getSSMParameterValue(ssmParamName, true);
  } catch (error) {
    if (
      error.toString().toLowerCase().includes('rate') ||
      error.toString().toLowerCase().includes('disconnected')
    ) {
      // Rate Exceeded error
      throw new Error('SSM Rate Limit Exceeded');
    } else {
      // Simply log an error and let the caller to decide what to do.
      log.error(`Error getting SSM Parameter: ${error}`);
    }
  }
};

const initializeDBConnection = async ({
  runServerless = false,
  mongoUri,
  lazyConnect = false,
}: {
  runServerless?: boolean;
  mongoUri?: string;
  lazyConnect?: boolean;
}): Promise<void> => {
  if (isConnected) {
    return;
  }

  // If an overridden mongoUri is passed in, this implies we're running unit tests
  if (mongoUri) {
    testRun = true;
  }

  let mongoURL = await resolveMongoURL(mongoUri);

  const secondaryNode = process.env.SECONDARY_NODE === '1' || false;
  const isLocalEnv = process.env.DEPLOYMENT_ENV === 'local';

  if (!isLocalEnv && secondaryNode) {
    // don't specify the secondary in local mode because it may not have one
    mongoURL += '&readPreference=secondaryPreferred';
    log.info('Connecting to Secondary Node');
  }

  const connectionOptions: ConnectOptions = {
    /* Buffering means mongoose will queue up operations if it gets
    disconnected from MongoDB and send them when it reconnects. */
    // With serverless, better to fail fast if not connected.
    bufferCommands: !runServerless, // disable mongoose buffering
    // bufferMaxEntries: 0, // and MongoDB driver buffering
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false, // make Mongoose use Mongo's findOneAndUpdate() - https://mongoosejs.com/docs/deprecations.html#-findandmodify-
    autoIndex: !!mongoUri || isLocalEnv, // enables autoIndex for tests
    maxPoolSize: runServerless ? 1 : 4,
    serverSelectionTimeoutMS: 24900, // default: 30000 (30s) but Express times out at 25s, Lambda REST at 26 https://mongoosejs.com/docs/connections.html#options
  };

  try {
    if (lazyConnect) {
      mongooseLazyConnect(async () => {
        await connect(mongoURL, connectionOptions);
      });
    } else {
      await connect(mongoURL, connectionOptions);
    }
  } catch (error) {
    log.error(`Error connecting to MongoDB: ${error}`);

    if (error?.reason?.type === 'ReplicaSetNoPrimary') {
      throw new Error('Database Error Replica Set No Primary');
    }

    if (
      !`${error}`.includes('ECONNREFUSED') &&
      (error instanceof MongoNetworkError ||
        `${error}`.includes('MongoNetworkError') ||
        `${error}`.includes('MongooseServerSelectionError'))
    ) {
      throw new Error('Connection Limit Error'); // tells the client to retry 429 too many requests
    } else {
      throw new Error('Database Error');
    }
  }
};

const closeConnection = async (): Promise<void> => {
  await connection.close();
};

connection.on('connecting', () => {
  if (!testRun) {
    log.info('Connecting to MongoDB.');
  }
});
connection.on('connected', () => {
  log.info('Connected to MongoDB.');
  isConnected = true;
});
connection.on('disconnected', () => {
  log.info('Disconnected from MongoDB.');
});
connection.on('reconnectFailed', () => {
  log.info('Reconnect to MongoDB failed.');
});
connection.on('error', (err) => {
  const errorDetails = {
    errorName: err?.name ?? '',
    errorMessage: err?.message ?? err,
    connectionState: isConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    ...(err?.stack ? { stack: err.stack } : {}),
  };

  log.error('MongoDB connection encountered an error.', errorDetails);
});

export default initializeDBConnection;
export { closeConnection };
