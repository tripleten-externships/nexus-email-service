import { Request, Response } from 'express';
import User from '../models/user';
import mongoose from 'mongoose';

// Use custom interface that includes code property
interface MongoError {
  code?: number;
}

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    res.send({ data: users });
  } catch (err) {
    res.status(500).send({ message: 'Error retrieving users.' });
  }
};

// Get user by ID
export const getIndividualUser = async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: 'Error retrieving user.' });
  }
};

// Create a user
export const createUser = async (req, res) => {
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

    const user = await User.create({ email, name, role, password });

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

module.exports = { getUsers, getIndividualUser, createUser };
