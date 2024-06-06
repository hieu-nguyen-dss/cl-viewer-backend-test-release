/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

import * as awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import cors from 'cors';
import express, { NextFunction } from 'express';
import { ValidationError } from './errors/ValidationError';
import router from './routes/routes';

const logErrors = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  console.error(err.stack);
  next(err);
};
const clientErrorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  res.status(err.status || 500);

  if (err instanceof ValidationError) {
    res.status(422);
  }

  res.json({
    message: err.message,
    error: err,
  });
};

// declare a new express app
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(cors());

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.use('/api', router);

app.listen(8000, () => {
  console.log('App started');
});

export default app;
