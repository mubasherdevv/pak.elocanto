import ActivityLog from '../models/ActivityLog.js';

export const logAdminActivity = async (adminId, actionType, data) => {
  try {
    await ActivityLog.create({
      adminId,
      actionType,
      targetId: data.targetId || null,
      targetType: data.targetType || null,
      description: data.description || '',
      ipAddress: data.ipAddress || null,
      location: data.location || null
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

export const logUserActivity = async (userId, actionType, data) => {
  try {
    await ActivityLog.create({
      userId,
      actionType,
      targetId: data.targetId || null,
      targetType: data.targetType || null,
      description: data.description || '',
      ipAddress: data.ipAddress || null,
      location: data.location || null
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
};

export const logActivity = async (type, actorId, actionType, data) => {
  if (type === 'admin') {
    return logAdminActivity(actorId, actionType, data);
  } else if (type === 'user') {
    return logUserActivity(actorId, actionType, data);
  }
};
