import { context, propagation } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { awsLambdaDetectorSync } from '@opentelemetry/resource-detector-aws';
import { detectResourcesSync, Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AlwaysOnSampler, BatchSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-base';
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment';

const otelExporterOtlpTracesEndpoint = process.env.SUMO_OTLP_HTTP_ENDPOINT_URL ?? '';
const otelEnvironment = process.env.DEPLOYMENT_ENV ?? 'Unknown';

let spanProcessors: SpanProcessor[] = [];
let sdk;

if (otelExporterOtlpTracesEndpoint) {
  const compositePropagator = new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
      new AWSXRayPropagator(),
    ],
  });
  const asyncContextManager = new AsyncLocalStorageContextManager();

  propagation.setGlobalPropagator(compositePropagator);
  context.setGlobalContextManager(asyncContextManager);

  const traceExporter = new OTLPTraceExporter({
    url: otelExporterOtlpTracesEndpoint,
    headers: {
      'X-Sumo-Category': 'APM',
      'X-Sumo-Name': 'nexus-email-service-traces',
    },
  });

  const batchProcessor = new BatchSpanProcessor(traceExporter);

  const loggableDbFieldNames = ['_id', 'type'];
  spanProcessors = [batchProcessor];

  // only use console span exporter in local environment (commented out unless needed for debugging)
  // if (otelEnvironment === 'local') {
  //   const consoleSpanExporter = new SimpleSpanProcessor(new ConsoleSpanExporter());
  //   spanProcessors.push(consoleSpanExporter);
  // }

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'nexus-email-service-traces',
      [ATTR_DEPLOYMENT_ENVIRONMENT]: otelEnvironment,
      application: 'nexus-email-service',
    }).merge(detectResourcesSync({ detectors: [awsLambdaDetectorSync] })),
    serviceName: 'nexus-email-service-traces',
    traceExporter,
    spanProcessors,
    sampler: new AlwaysOnSampler(),
    contextManager: asyncContextManager,
    textMapPropagator: compositePropagator,
    instrumentations: [
      ...getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-aws-sdk': {
          enabled: true,
          sqsExtractContextPropagationFromPayload: false,
        },
        '@opentelemetry/instrumentation-aws-lambda': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-mongodb': {
          enabled: true,
          enhancedDatabaseReporting: true,
          dbStatementSerializer: (cmd: Record<string, unknown>) => {
            // sanitize the value of any field that's not explicitly allowed in the loggableDbFieldNames array
            const sanitizedCmd = Object.keys(cmd).reduce((acc: Record<string, unknown>, key) => {
              if (loggableDbFieldNames.includes(key)) {
                acc[key] = cmd[key];
              } else {
                acc[key] = '[REDACTED]';
              }
              return acc;
            }, {});
            return JSON.stringify(sanitizedCmd);
          },
        },
        '@opentelemetry/instrumentation-mongoose': {
          enabled: true,
          suppressInternalInstrumentation: true,
        },
      }),
    ],
  });

  sdk.start();
}

export { sdk, spanProcessors };
