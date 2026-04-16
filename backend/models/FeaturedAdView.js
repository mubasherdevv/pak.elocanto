import mongoose from 'mongoose';

const featuredAdViewSchema = new mongoose.Schema({
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  page: {
    type: String,
    enum: ['homepage', 'category', 'ads', 'search', 'detail'],
    default: 'ads'
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
});

featuredAdViewSchema.index({ adId: 1 });
featuredAdViewSchema.index({ viewedAt: -1 });
featuredAdViewSchema.index({ page: 1 });

const FeaturedAdView = mongoose.model('FeaturedAdView', featuredAdViewSchema);

export default FeaturedAdView;
