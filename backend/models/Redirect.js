import mongoose from 'mongoose';

const redirectSchema = new mongoose.Schema(
  {
    fromPath: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    toPath: {
      type: String,
      required: true,
      trim: true
    },
    statusCode: {
      type: Number,
      default: 301,
      enum: [301, 302]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Pre-save middleware to ensure paths start with /
redirectSchema.pre('save', function() {
  if (this.fromPath && !this.fromPath.startsWith('/')) {
    this.fromPath = '/' + this.fromPath;
  }
  if (this.toPath && !this.toPath.startsWith('/') && !this.toPath.startsWith('http')) {
    this.toPath = '/' + this.toPath;
  }
});

const Redirect = mongoose.model('Redirect', redirectSchema);
export default Redirect;
