import { DeployEnvironmentType } from './environmentServerURL';

const deploymentEnv = process.env.DEPLOYMENT_ENV || DeployEnvironmentType.LOCAL;
const nodeEnv = process.env.NODE_ENV || 'development';

export const DeploymentEnvironment = {
  env: deploymentEnv,

  isProd: deploymentEnv === DeployEnvironmentType.PROD,

  isLocal: deploymentEnv === DeployEnvironmentType.LOCAL,

  isDev: deploymentEnv === DeployEnvironmentType.DEV,

  isStaging: deploymentEnv === DeployEnvironmentType.STAGING,

  // The NODE_ENV is automatically set to 'test' by jest when running tests.
  isTest: nodeEnv === DeployEnvironmentType.TEST,
};
