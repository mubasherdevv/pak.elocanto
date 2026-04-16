import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Generate conversation ID (sorted user IDs + ad ID for uniqueness)
const getConversationId = (userId1, userId2, adId) => {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `${sorted[0]}_${sorted[1]}_${adId}`;
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, adId, text } = req.body;
  const conversationId = getConversationId(req.user._id, receiverId, adId);
  const message = await Message.create({
    conversationId,
    sender: req.user._id,
    receiver: receiverId,
    ad: adId,
    text,
  });
  const populated = await message.populate([
    { path: 'sender', select: 'name profilePhoto' },
    { path: 'receiver', select: 'name profilePhoto' },
  ]);
  res.status(201).json(populated);
});

// @desc    Get user's conversations (unique threads)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req, res) => {
  // Get all messages where user is sender or receiver
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }]
  })
    .populate('sender', 'name profilePhoto city')
    .populate('receiver', 'name profilePhoto city')
    .populate('ad', 'title images price')
    .sort({ createdAt: -1 });

  // Group by conversationId, keep only latest message per thread
  const threadsMap = {};
  for (const msg of messages) {
    if (!threadsMap[msg.conversationId]) {
      threadsMap[msg.conversationId] = msg;
    }
  }

  // Count unread per thread
  const threads = await Promise.all(
    Object.values(threadsMap).map(async (msg) => {
      const unread = await Message.countDocuments({
        conversationId: msg.conversationId,
        receiver: req.user._id,
        isRead: false,
      });
      const other = msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
      return { ...msg.toObject(), other, unreadCount: unread };
    })
  );

  res.json(threads);
});

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.conversationId })
    .populate('sender', 'name profilePhoto')
    .populate('receiver', 'name profilePhoto')
    .sort({ createdAt: 1 });

  // Mark received messages as read
  await Message.updateMany(
    { conversationId: req.params.conversationId, receiver: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json(messages);
});

// @desc    Start or get conversation with a seller about an ad
// @route   GET /api/messages/thread/:sellerId/:adId
// @access  Private
export const getOrCreateThread = asyncHandler(async (req, res) => {
  const { sellerId, adId } = req.params;
  const conversationId = getConversationId(req.user._id, sellerId, adId);
  const messages = await Message.find({ conversationId })
    .populate('sender', 'name profilePhoto')
    .populate('receiver', 'name profilePhoto')
    .sort({ createdAt: 1 });
  const seller = await User.findById(sellerId).select('name profilePhoto city');
  res.json({ conversationId, messages, seller });
});


