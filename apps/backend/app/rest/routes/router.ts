import * as express from 'express';

import log from '../../../logging/log';

// This is a no-op middleware that will be used if rate-limiting is not enabled for the route.
const noopMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => next();

const routesToMonitor = ['forgotPassword', 'signUp'];
const logIfMonitoringRoute = (route: string, logMessage: string): void => {
  if (routesToMonitor.includes(route)) {
    log.info(logMessage);
  }
};

enum HttpMethod {
  POST = 'POST',
  PUT = 'PUT',
}

interface EndpointParams {
  router: express.Router;
  route: string;
  run: (
    // Typing `data` as any because Record<string, unknown> causes more issues than it solves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    ipAddress: string,
    req: express.Request
    // Typing the return value as `any` because Record<string, unknown> causes more issues than it solves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>;
  errorHandler?: (err: unknown, data?: Record<string, unknown>) => void;
}

const createEndpoint = (method: HttpMethod, params: EndpointParams): void => {
  const { router, route, run, errorHandler } = params;

  router[method.toLowerCase()](
    `/${route}`,
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ): Promise<express.Response | void> => {
      try {
        logIfMonitoringRoute(route, `Received ${route} ${method} request`);

        const data = req.body;
        log.debug(`Received ${route} ${method} request with ${JSON.stringify(data)}`);

        const result = await run(data, '127.0.0.1', req);
        logIfMonitoringRoute(route, `Received ${route} ${method} result - ${result}}`);

        return res.json(result || {});
      } catch (err) {
        if (errorHandler) {
          try {
            logIfMonitoringRoute(
              route,
              `Received ${route} ${method.toUpperCase()} Req Body - ${JSON.stringify(req?.body)}}`
            );

            await errorHandler(err, req?.body);
          } catch (e) {
            log.error(e);
          }
        }
        return next(err);
      }
    }
  );
};

const createPostEndpoint = (params: EndpointParams): void => {
  createEndpoint(HttpMethod.POST, params);
};

const createPutEndpoint = (params: EndpointParams): void => {
  createEndpoint(HttpMethod.PUT, params);
};

export { createPostEndpoint, createPutEndpoint };
