import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createManualBackup, getBackups, removeBackup, restoreFromBackup, downloadBackup, uploadBackup } from '../controllers/backupController.js';

const router = express.Router();

// Configure multer for Backup Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    cb(null, backupDir);
  },
  filename: (req, file, cb) => {
    // Preserve original name but sanitize or timestamp if needed
    // For now, let's keep it simple: uploaded_backup_TIMESTAMP.zip
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'manual_upload_' + uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.zip') {
    cb(null, true);
  } else {
    cb(new Error('Only .zip backup files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB Limit
});

router.post('/create', protect, admin, createManualBackup);
router.get('/list', protect, admin, getBackups);
router.get('/download/:backupName', protect, admin, downloadBackup);
router.delete('/:backupName', protect, admin, removeBackup);
router.post('/restore', protect, admin, restoreFromBackup);
router.post('/upload', protect, admin, upload.single('backup'), uploadBackup);

export default router;
