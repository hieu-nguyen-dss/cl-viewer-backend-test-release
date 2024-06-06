import express, { NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getUserById } from '../../../../clviewercommons/opt/users';

declare global {
  namespace Express {
    interface Request {
      user: any;
      admin: boolean;
    }
  }
}

export const userAuthMiddleware = async (req: express.Request, res: express.Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).send({ error: 'Missing Authorization Header.' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.error(err);
      return res.sendStatus(403);
    }

    if (!payload) {
      return res.sendStatus(403);
    }

    getUserById(payload.userId)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => res.sendStatus(403));
  });
};

export const adminAuthMiddleware = (req: express.Request, res: express.Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).send({ error: 'Missing Authorization Header.' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.error(err);
      return res.sendStatus(403);
    }
    if (!payload) {
      return res.sendStatus(403);
    }
    if (!payload.admin) {
      return res.status(403).send({ error: 'User does not have admin role.' });
    }

    getUserById(payload.userId)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => res.sendStatus(403));
  });
};
