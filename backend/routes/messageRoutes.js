import express from 'express';
import { sendMessage, getConversations, getMessages, getOrCreateThread } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/thread/:sellerId/:adId', protect, getOrCreateThread);
router.get('/:conversationId', protect, getMessages);

export default router;
