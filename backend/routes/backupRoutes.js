import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { createManualBackup, getBackups, removeBackup, restoreFromBackup, downloadBackup } from '../controllers/backupController.js';

const router = express.Router();

router.post('/create', protect, admin, createManualBackup);
router.get('/list', protect, admin, getBackups);
router.get('/download/:backupName', protect, admin, downloadBackup);
router.delete('/:backupName', protect, admin, removeBackup);
router.post('/restore', protect, admin, restoreFromBackup);

export default router;
