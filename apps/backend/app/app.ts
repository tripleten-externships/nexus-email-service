import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

import router from './rest/routes/sendGridHook';

import log from '../logging/log';

dotenv.config();

const inDevelopmentMode = process.env.DEPLOYMENT_ENV === 'local';
log.info(`NODE_ENV: ${process.env.NODE_ENV}`);
log.info(`inDevelopmentMode: ${inDevelopmentMode}`);

const app = express();
app.disable('x-powered-by');

app.use(
  express.json({
    limit: '6Mb',
    verify: (req, res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  })
); // lamda limit is 6Mb
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(awsServerlessExpressMiddleware.eventContext());

const corsOptions: cors.CorsOptions = {
  origin: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  preflightContinue: false, // pass the CORS preflight response to the next handler.
  optionsSuccessStatus: 200, // use 200 for some legacy browsers (IE11, various SmartTVs) choke on 204
};
// Use cors middleware for all routes instead of specific wildcard route
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.locals.userAgent = 'user-agent' in req.headers ? req.headers['user-agent'] : 'Unknown';
  // security-related headers
  res.setHeader('X-XSS-Protection', '1');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains;');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "Include default-src 'self'");
  res.setHeader('X-Download-Options', 'noopen');

  // cache-related headers
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

app.use(router);

app.get('/', (req, res) => {
  res.status(200).send('Hello World');
});

app.use((err, req, res, next) => {
  log.error(err);
  res.status(500).send('Internal Server Error');
});

export default app;
