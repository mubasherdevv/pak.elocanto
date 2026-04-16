import fs from 'fs';
import path from 'path';
import { addWatermarkToBuffer } from '../utils/watermarkUtils.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DRY_RUN = process.argv.includes('--dry-run');

console.log('==============================================');
console.log('   BULK WATERMARK SYSTEM - ELOCANTO   ');
console.log('==============================================');
console.log(`Target Directory: ${UPLOADS_DIR}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (Viewing only)' : 'EXECUTION (Writing files)'}`);
console.log('----------------------------------------------');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Exclude temp and cache
      if (entry.name === '.temp' || entry.name === '.cache') continue;
      count += await processDirectory(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        // Exclude the watermark logo itself
        if (entry.name === 'watermark.png') continue;

        if (DRY_RUN) {
          console.log(`[FOUND] ${path.relative(UPLOADS_DIR, fullPath)}`);
          count++;
        } else {
          try {
            console.log(`[PROCESSING] ${path.relative(UPLOADS_DIR, fullPath)}...`);
            const buffer = fs.readFileSync(fullPath);
            const watermarkedBuffer = await addWatermarkToBuffer(buffer);
            
            // Overwrite original file
            fs.writeFileSync(fullPath, watermarkedBuffer);
            count++;
          } catch (err) {
            console.error(`[ERROR] Failed to process ${entry.name}:`, err.message);
          }
        }
      }
    }
  }
  return count;
}

async function run() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.error('Error: uploads directory not found');
      return;
    }

    const total = await processDirectory(UPLOADS_DIR);
    
    console.log('----------------------------------------------');
    if (DRY_RUN) {
      console.log(`Dry run complete. Found ${total} images to process.`);
      console.log('To apply changes, run the command WITHOUT --dry-run');
    } else {
      console.log(`Success! Processed ${total} images.`);
    }
    console.log('==============================================');
  } catch (err) {
    console.error('Fatal Error:', err.message);
  }
}

run();
