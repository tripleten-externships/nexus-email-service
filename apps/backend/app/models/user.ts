import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

interface User {
  email: String;
  name: String;
  role: String;
  password: String;
  loginTracking: Number | Date;
  preferences: String;
}

const userSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator(value) {
        return validator.isEmail(value);
      },
      message: 'You must enter a valid email',
    },
  },
  name: { type: String, required: true, unique: true, minlength: 2, maxlength: 30 },
  role: { type: String, required: true, enum: ['admin', 'editor', 'viewer'] },
  password: { type: String, required: true, minlength: 8 },
  loginTracking: {
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
  },
  // TODO in the future: preferences:
});

const User = mongoose.model('User', userSchema);
export default User;
