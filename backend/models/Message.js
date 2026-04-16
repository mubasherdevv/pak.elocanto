import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
    },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
