enum DeployEnvironmentType {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod',
  LOCAL = 'local',
  TEST = 'test',
}
enum EnvironmentServerURL {
  TRIPLETEN = 'TRIPLETEN',
  REST = 'REST',
}

const EnvironmentSettings = {
  prod: {
    TRIPLETEN: 'https://app.internal-tripleten.com',
    REST: 'https://rest-prod.internal-tripleten.com',
  },
  staging: {
    TRIPLETEN: 'https://qa-app.internal-tripleten.com',
    REST: 'https://rest-staging.internal-tripleten.com',
  },
  dev: {
    TRIPLETEN: 'https://app-dev.internal-tripleten.com',
    REST: 'https://rest-dev.internal-tripleten.com',
  },
  local: {
    TRIPLETEN: 'http://localhost:3009',
    REST: 'http://localhost:3002',
  },
};

export default EnvironmentServerURL;

export { DeployEnvironmentType, EnvironmentSettings };
