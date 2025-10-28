import mongoose from 'mongoose';
import log from '../../logging/log';

// import './userModel';
import './emailEvent.model';

/**
 * Initialize all models and ensure their collections exist in MongoDB
 */
export async function initializeModels(): Promise<void> {
  try {
    // check if DB connection is ready
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      log.warn(
        `MongoDB connection not ready. Current state: ${mongoose.connection?.readyState || 'No connection'}`
      );
      log.warn(
        'Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting'
      );
      log.warn('Will try to continue initializing models but may encounter errors');
    }

    const modelNames = mongoose.modelNames();
    log.info(`Found ${modelNames.length} models to initialize: ${modelNames.join(', ')}`);

    if (modelNames.length === 0) {
      log.warn('No models found. Make sure models are imported before calling initializeModels()');
      return;
    }

    for (const modelName of modelNames) {
      try {
        const model = mongoose.model(modelName);
        log.info(`Processing model: ${modelName} with collection name: ${model.collection.name}`);

        if (mongoose.connection.db) {
          // create a collection explicitly to ensure it exists
          await mongoose.connection.db.createCollection(model.collection.name).catch((err) => {
            // if collection already exists, this is fine
            if (err.code === 48) {
              // Error code for "collection already exists"
              log.info(`Collection ${model.collection.name} already exists`);
            } else {
              throw err;
            }
          });

          // verify the collection exists
          const collectionExists = await mongoose.connection.db
            .listCollections({ name: model.collection.name })
            .hasNext();
          log.info(`Collection ${model.collection.name} exists: ${collectionExists}`);

          if (collectionExists) {
            log.info(`Successfully initialized collection: ${model.collection.name}`);
          } else {
            log.error(`Failed to initialize collection: ${model.collection.name}`);
          }
        } else {
          log.error(
            `Cannot initialize collection for ${modelName}: database connection not fully established`
          );
        }
      } catch (modelError) {
        log.error(`Error processing model ${modelName}: ${modelError}`);
      }
    }

    log.info(`All collections initialization attempted. Total models: ${modelNames.length}`);
  } catch (error) {
    log.error(
      `Error initializing collections: ${error instanceof Error ? error.stack : String(error)}`
    );
    throw error;
  }
}
