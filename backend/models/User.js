import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    bio: { type: String, default: '' },
    isAdmin: { type: Boolean, required: true, default: false },
    permissions: { type: [String], default: [] },
    isBanned: { type: Boolean, default: false },
    lastLogin: { type: Date },
    badges: { type: [String], default: [] },
    googleId: { type: String },
    provider: { type: String, default: 'local' },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    warnings: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
    return;
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }
  
  await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
