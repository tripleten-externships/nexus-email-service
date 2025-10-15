import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import log from '../logging/log';

const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Requires a policy for SSM:GetParameter on the parameter being read.
 * withDecryption, when true, decrypts the value of secureStrings.
 * @param paramName The name of the parameter to fetch.
 * @param withDecryption Whether the value needs decryption or not. Default = false.
 */
export const getSSMParameterValue = async (
  paramName: string,
  withDecryption = false
): Promise<string> => {
  log.info(`Getting SSM Param: ${paramName}...`);
  const params = {
    Name: paramName,
    // NOTE: this parameter name must be capitalized!
    WithDecryption: withDecryption,
  };

  const command = new GetParameterCommand(params);
  const result = await ssm.send(command);

  if (!result.Parameter) {
    log.error('Error: No data in SSM response.');
    throw new Error('SSM_PARAMETER_ERROR');
  }
  const value = result.Parameter.Value;
  if (!value) {
    log.error(`Error: Couldn't get value of SSM Parameter ${paramName}`);
    throw new Error('SSM_PARAMETER_ERROR');
  }
  return value;
};
