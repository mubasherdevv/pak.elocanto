import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      // Admin actions
      'ADMIN_LOGIN',
      'ADMIN_LOGOUT',
      'CREATE_AD',
      'EDIT_AD',
      'DELETE_AD',
      'CREATE_CATEGORY',
      'EDIT_CATEGORY',
      'DELETE_CATEGORY',
      'CREATE_SUBCATEGORY',
      'EDIT_SUBCATEGORY',
      'DELETE_SUBCATEGORY',
      'CREATE_SUBSUBCATEGORY',
      'EDIT_SUBSUBCATEGORY',
      'DELETE_SUBSUBCATEGORY',
      'BAN_USER',
      'UNBAN_USER',
      'ASSIGN_BADGE',
      'REMOVE_BADGE',
      'BADGE_ASSIGN',
      'BADGE_REMOVE',
      'EDIT_USER',
      'CREATE_USER',
      'DELETE_USER',
      'UPDATE_SETTINGS',
      'UPDATE_ADS_DURATION',
      'UPDATE_SEO',
      'CREATE_BACKUP',
      'RESTORE_BACKUP',
      // User actions
      'USER_REGISTER',
      'USER_LOGIN',
      'POST_AD',
      'EDIT_USER_AD',
      'DELETE_USER_AD',
      'VIEW_AD',
      'CONTACT_SELLER_CALL',
      'CONTACT_SELLER_WHATSAPP',
      'REPORT_AD',
      'ADD_FAVORITE',
      'REMOVE_FAVORITE'
    ]
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetType: {
    type: String,
    enum: ['Ad', 'Category', 'Subcategory', 'SubSubCategory', 'User', 'Settings', 'SeoContent', null],
    default: null
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ actionType: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
