import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

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
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return res.status(500).send({ message: 'Server configuration error.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (err: unknown) {
    return res.status(401).send({ message: 'Authorization required.' });
  }

  return next();
};
