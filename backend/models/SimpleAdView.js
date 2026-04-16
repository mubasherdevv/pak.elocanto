import mongoose from 'mongoose';

const simpleAdViewSchema = new mongoose.Schema({
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  localStorageId: {
    type: String,
    default: null
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
});

simpleAdViewSchema.index({ adId: 1 });
simpleAdViewSchema.index({ userId: 1 });
simpleAdViewSchema.index({ ipAddress: 1 });
simpleAdViewSchema.index({ localStorageId: 1 });
simpleAdViewSchema.index({ adId: 1, userId: 1 });
simpleAdViewSchema.index({ adId: 1, ipAddress: 1 });
simpleAdViewSchema.index({ viewedAt: -1 });
simpleAdViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SimpleAdView = mongoose.model('SimpleAdView', simpleAdViewSchema);

export default SimpleAdView;
