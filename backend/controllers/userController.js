import User from '../models/User.js';
import Ad from '../models/Ad.js';
import ActivityLog from '../models/ActivityLog.js';
import generateToken from '../utils/generateToken.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeNotification } from '../utils/email.js';
import { validateEmail } from '../utils/validators.js';
import { logUserActivity } from '../utils/activityLogger.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (user && user.isLocked()) {
    return res.status(423).json({ 
      message: 'Account is temporarily locked due to too many failed attempts. Try again later.',
      lockUntil: user.lockUntil
    });
  }
  
  if (user && (await user.matchPassword(password))) {
    if (user.isBanned) return res.status(403).json({ message: 'Account is banned' });
    if (user.provider === 'local' && !user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first', needsVerification: true, userId: user._id });
    }
    
    user.lastLogin = new Date();
    await user.resetLoginAttempts();
    await user.save();

    logUserActivity(user._id, 'USER_LOGIN', {
      description: `User logged in: ${user.name}`,
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      isAdmin: user.isAdmin,
      badges: user.badges || [],
      permissions: user.permissions || [],
      token: generateToken(user._id),
    });
  } else {
    if (user) {
      await user.incrementLoginAttempts();
      const attemptsLeft = 5 - (user.failedLoginAttempts + 1);
      if (attemptsLeft <= 0) {
        return res.status(423).json({ message: 'Account locked due to too many failed attempts. Try again in 15 minutes.' });
      }
      return res.status(401).json({ message: `Invalid email or password. ${attemptsLeft} attempts remaining.` });
    }
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Google OAuth - Login/Register with Google
// @route   POST /api/users/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, name, email, profilePhoto } = req.body;
  let user = await User.findOne({ googleId });
  
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      user.provider = 'google';
      if (profilePhoto && !user.profilePhoto) user.profilePhoto = profilePhoto;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        profilePhoto: profilePhoto || '',
        password: googleId + '_google_oauth_dummy',
        lastLogin: new Date(),
      });
    }
  }

  if (user.isBanned) return res.status(403).json({ message: 'Account is banned' });

  user.lastLogin = new Date();
  await user.save();

  const isNewUser = !user.googleId || user.provider !== 'google';
  if (isNewUser) {
    logUserActivity(user._id, 'USER_REGISTER', {
      description: `New user registered via Google: ${user.name}`,
      ipAddress: req.ip || req.connection?.remoteAddress
    });
  } else {
    logUserActivity(user._id, 'USER_LOGIN', {
      description: `User logged in via Google: ${user.name}`,
      ipAddress: req.ip || req.connection?.remoteAddress
    });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    isAdmin: user.isAdmin,
    badges: user.badges || [],
    permissions: user.permissions || [],
    token: generateToken(user._id),
  });
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city } = req.body;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.message });
  }
  
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });
  
  const user = await User.create({ 
    name, email, password, phone: phone || '', city: city || '', lastLogin: new Date() 
  });

  await sendVerificationEmail(user);

  logUserActivity(user._id, 'USER_REGISTER', {
    description: `New user registered: ${name}`,
    ipAddress: req.ip || req.connection?.remoteAddress
  });

  res.status(201).json({
    message: 'Verification code sent to your email',
    userId: user._id,
  });
});

// @desc    Verify email with code
// @route   POST /api/users/verify
// @access  Public

// @desc    Resend verification code
// @route   POST /api/users/resend-verify
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  if (user.isVerified) {
    return res.json({ message: 'Email already verified', user });
  }

  if (user.verificationCode !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  if (user.verificationCodeExpires < new Date()) {
    return res.status(400).json({ message: 'Verification code expired' });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.json({ 
    message: 'Email verified successfully',
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
      isAdmin: user.isAdmin,
      permissions: user.permissions || [],
      badges: user.badges || [],
    }
  });
});

// @desc    Resend verification code
// @route   POST /api/users/resend-verify
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

  await sendVerificationEmail(user);
  res.json({ message: 'Verification code resent' });
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  await sendPasswordResetEmail(user);
  res.json({ message: 'Password reset code sent to your email', userId: user._id });
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { userId, code, password } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.resetPasswordCode !== code) {
    return res.status(400).json({ message: 'Invalid reset code' });
  }

  if (user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: 'Reset code expired' });
  }

  user.password = password;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await sendPasswordChangeNotification(user);

  res.json({ message: 'Password reset successfully' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    badges: user.badges || [],
    permissions: user.permissions || [],
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
  user.city = req.body.city !== undefined ? req.body.city : user.city;
  user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
  user.profilePhoto = req.body.profilePhoto !== undefined ? req.body.profilePhoto : user.profilePhoto;
  if (req.body.password) user.password = req.body.password;
  const updated = await user.save();
  res.json({
    _id: updated._id, name: updated.name, email: updated.email,
    phone: updated.phone, city: updated.city, profilePhoto: updated.profilePhoto,
    bio: updated.bio, isAdmin: updated.isAdmin, badges: updated.badges || [], permissions: updated.permissions || [], token: generateToken(updated._id),
  });
});

// @desc    Get public profile of a seller
// @route   GET /api/users/:id/public
// @access  Public
const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -isAdmin -isBanned');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const adCount = await Ad.countDocuments({ seller: user._id, isActive: true, isApproved: true });
  res.json({ ...user.toObject(), adCount });
});

// @desc    Admin â€“ get all users
// @route   GET /api/users/admin/all
// @access  Admin
const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  
  // Enrich users with ad count
  const enrichedUsers = await Promise.all(users.map(async (user) => {
    const adCount = await Ad.countDocuments({ seller: user._id });
    return { ...user.toObject(), adCount };
  }));

  res.json(enrichedUsers);
});

// @desc    Admin â€“ ban/unban user
// @route   PUT /api/users/admin/:id/ban
// @access  Admin
const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const wasBanned = user.isBanned;
  user.isBanned = !user.isBanned;
  await user.save();
  
  await ActivityLog.create({
    adminId: req.user._id,
    actionType: wasBanned ? 'UNBAN_USER' : 'BAN_USER',
    description: wasBanned ? `Unbanned user: ${user.name}` : `Banned user: ${user.name}`,
    targetId: user._id,
    targetType: 'User'
  });
  
  res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
});

// @desc    Admin â€“ Create user
// @route   POST /api/users/admin/create
// @access  Admin
const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });
  const user = await User.create({ name, email, password, isAdmin: isAdmin || false, permissions: req.body.permissions || [] });
  
  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'CREATE_USER',
    description: `Created user: ${name} (${isAdmin ? 'Admin' : 'User'})`,
    targetId: user._id,
    targetType: 'User'
  });
  
  res.status(201).json(user);
});

// @desc    Admin â€“ Update user
// @route   PUT /api/users/admin/:id
// @access  Admin
const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
  user.city = req.body.city !== undefined ? req.body.city : user.city;
  user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
  if (req.body.badges !== undefined) user.badges = req.body.badges;
  if (req.body.permissions !== undefined) user.permissions = req.body.permissions;
  if (req.body.password) user.password = req.body.password;
  const updated = await user.save();
  
  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'EDIT_USER',
    description: `Updated user: ${user.name}`,
    targetId: user._id,
    targetType: 'User'
  });
  
  res.json(updated);
});

// @desc    Admin â€“ Delete user
// @route   DELETE /api/users/admin/:id
// @access  Admin
const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const userName = user.name;
  // Cascading delete: Remove all ads by this user (Triggers middleware)
  const ads = await Ad.find({ seller: user._id });
  for (const ad of ads) {
    await ad.deleteOne();
  }
  
  await user.deleteOne();
  
  await ActivityLog.create({
    adminId: req.user._id,
    actionType: 'DELETE_USER',
    description: `Deleted user: ${userName} and all associated listings`,
    targetType: 'User'
  });
  
  res.json({ message: 'User removed and all associated listings deleted' });
});

export { authUser, googleAuth, registerUser, verifyEmail, resendVerification, forgotPassword, resetPassword, getUserProfile, updateUserProfile, getPublicProfile, getAllUsersAdmin, toggleBanUser, adminCreateUser, adminUpdateUser, adminDeleteUser };


