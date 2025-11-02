import { Request, Response } from 'express';
import { User } from '../models/user';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Use custom interface that includes code property
interface MongoError {
  code?: number;
}

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    res.send({ data: users });
  } catch (err: unknown) {
    res.status(500).send({ message: 'Error retrieving users.' });
  }
};

// Get user by ID
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    res.send(user);
  } catch (err: unknown) {
    res.status(500).send({ message: 'Error retrieving user.' });
  }
};

// Create a user
export const createUser = async (req: Request, res: Response) => {
  const { email, name, role, password } = req.body;

  if (!email) {
    return res.status(400).send({ message: 'Email required.' });
  }

  if (!password) {
    return res.status(400).send({ message: 'Password required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ message: 'A user with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, role, password: hash });

    res.status(201).send({
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: unknown) {
    console.error(err);

    if (typeof err === 'object' && err !== null && 'code' in err) {
      const mongoError = err as MongoError;
      if (mongoError.code === 11000) {
        return res.status(409).send({ message: 'A user with this email already exists.' });
      }

      if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).send({ message: 'Invalid input, please try again.' });
      }
    }
  }
};

export const logIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findUserByCredentials(email, password);

    if (user === null) {
      return res.status(401).send({ message: 'Incorrect email or password.' });
    }
  } catch (err: unknown) {
    return res.status(401).send({ message: 'Unauthorized request.' });
  }
};
