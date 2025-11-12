import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Create a custom Request interface to add the 'user' property
interface CustomRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Authorization required.' });
  }

  const token = authorization.replace('Bearer ', '');
  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err: unknown) {
    return res.status(401).send({ message: 'Authorization required.' });
  }

  return next();
};
