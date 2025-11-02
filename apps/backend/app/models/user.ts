import mongoose, { Schema, Model } from 'mongoose';
import validator from 'validator';
import * as bcrypt from 'bcryptjs';

interface IUser {
  email: String;
  name: String;
  role: String;
  password: String;
  loginTracking: Number | Date;
  preferences: String;
}

interface UserModelStatic extends Model<IUser> {
  findUserByCredentials(email: String, password: String);
}

const userSchema: Schema = new Schema<IUser>({
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
  role: { type: String, required: true, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  password: { type: String, required: true, minlength: 8 },
  loginTracking: {
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
  },
  // TODO in the future: preferences:
});

userSchema.statics.findUserByCredentials = async function findUserByCredentials(email, password) {
  const user = await this.findOne({ email }).select('+password');
  if (!user) return null;

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) return null;

  return user;
};

export const User = mongoose.model<IUser, UserModelStatic>('User', userSchema);
// export default User;
