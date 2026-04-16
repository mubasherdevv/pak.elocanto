import express from 'express';
import { getResizedImage } from '../controllers/imageController.js';

const router = express.Router();

router.get('/*', getResizedImage);

export default router;
