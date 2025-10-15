import * as winston from 'winston';
import { DeploymentEnvironment } from '../app/deploymentEnvironment';

// Winston 2.x documentation can be found at: https://github.com/winstonjs/winston/tree/2.x
const log = winston;

// This is a custom format which simply puts the log level in square brackets.
// The rest of the log message is output as it was before implementing the custom format.
const customFormat = winston.format.printf(({ level, message, ...meta }) => {
  // If there's a meta object, stringify it
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';

  // Wrap the log level in square brackets and uppercase it so it stands out
  const logLevel = `[${level.toUpperCase()}]`;
  return `${logLevel} ${message} ${metaStr}`;
});

const inTestMode = DeploymentEnvironment.isTest || process.env.CI === 'true';

/** ***********************************************************
 * This first call to winston.configure happens immediately as the module is loaded.
 * This just sets up the default logging which would only impact the first few things
 * that log as the server starts up. The configureLogging function will then be called
 * early in the server startup process, so all subsequent logs will use that configuration.
 *********************************************************** */
const transport = new winston.transports.Console({
  format: customFormat,
  stderrLevels: [],
  level: inTestMode ? 'error' : 'silly',
});
winston.configure({ transports: [transport] });

/** ***********************************************************
 * This call to winston.configure happens as the server is starting up, but after Settings
 * have been loaded. This is where we configure the logging system based on the settings.
 *********************************************************** */
async function configureLogging({}: {}): Promise<void> {
  const transports: winston.transport[] = [];

  const consoleTransport = new winston.transports.Console({
    format: customFormat,
    stderrLevels: [],
    // For production, we only log info and above
    level: DeploymentEnvironment.isProd ? 'info' : 'silly',
    silent: inTestMode,
  });
  transports.push(consoleTransport);

  winston.configure({ transports });
}

export default log;
export { configureLogging };
