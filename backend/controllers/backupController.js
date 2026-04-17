import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { createBackup, listBackups, deleteBackup, restoreBackup } from '../scripts/backup.js';
import ActivityLog from '../models/ActivityLog.js';

export const downloadBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const backupDir = path.resolve(process.cwd(), 'backups');
    const filePath = path.join(backupDir, backupName);

    // Security: Only allow files ending in .zip and within backupDir
    if (!backupName.endsWith('.zip') || !filePath.startsWith(backupDir)) {
      return res.status(403).json({ message: 'Invalid file request' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.download(filePath, backupName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

export const createManualBackup = async (req, res) => {
  try {
    console.log('[BACKUP] Request received at', new Date().toISOString());
    
    // Log the start of the backup
    await ActivityLog.create({
      adminId: req.user?._id,
      actionType: 'CREATE_BACKUP',
      description: 'System backup process initiated manually...',
      targetType: 'Settings'
    });

    const result = await createBackup({
      includeUploads: true,
      retentionDays: 7
    });

    // Log the activity
    await ActivityLog.create({
      adminId: req.user?._id,
      actionType: 'CREATE_BACKUP',
      description: `Manual backup created: ${result.archive ? result.archive.split(/[\\/]/).pop() : 'Success'}`,
      targetType: 'Settings'
    });

    res.json({
      success: true,
      message: 'Backup created successfully',
      details: {
        size: result.size,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('========================================');
    console.error('[BACKUP] FATAL ERROR during manual backup creation:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================');
    
    res.status(500).json({
      success: false,
      message: 'Backup failed: ' + error.message,
      error: error.message,
      location: 'createManualBackup',
      timestamp: new Date().toISOString()
    });
  }
};

export const getBackups = async (req, res) => {
  try {
    const backups = listBackups();
    res.json({ backups });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

export const removeBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    deleteBackup(backupName);

    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

export const restoreFromBackup = async (req, res) => {
  try {
    const { backupFile } = req.body;

    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup file is required'
      });
    }

    await restoreBackup(backupFile);

    // Log the activity
    await ActivityLog.create({
      adminId: req.user?._id,
      actionType: 'RESTORE_BACKUP',
      description: `System restored from backup: ${backupFile}`,
      targetType: 'Settings'
    });

    res.json({
      success: true,
      message: 'Restore completed successfully. Please restart the server.'
    });
  } catch (error) {
    console.error('Restore Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error.message
    });
  }
};
export const uploadBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const backupDir = path.resolve(process.cwd(), 'backups');
    const destinationPath = path.join(backupDir, req.file.filename);

    // Initial check is done by multer, but let's confirm the file exists in destination
    if (!fs.existsSync(destinationPath)) {
       // Multer should have already placed it there, but safety first
       return res.status(500).json({ message: 'Backup file failed to save' });
    }

    // Log the activity
    await ActivityLog.create({
      adminId: req.user?._id,
      actionType: 'CREATE_BACKUP',
      description: `Manual backup uploaded: ${req.file.originalname}`,
      targetType: 'Settings'
    });

    res.json({
      success: true,
      message: 'Backup uploaded successfully. It is now available in the list.',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload backup',
      error: error.message
    });
  }
};
