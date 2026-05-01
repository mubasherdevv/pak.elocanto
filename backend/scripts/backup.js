import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// backup.js is in backend/scripts, so we go up one level to reach backend/
const BACKEND_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(BACKEND_DIR, 'backups');
const UPLOADS_DIR = path.join(BACKEND_DIR, 'uploads');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const getBackupFilename = () => {
  const date = new Date();
  return `backup_${date.toISOString().replace(/[:.]/g, '-')}`;
};

export const createBackup = async (options = {}) => {
  const { includeUploads = true, retentionDays = 7 } = options;

  const backupName = getBackupFilename();
  // Use system temp directory to avoid triggering nodemon
  const tempDir = path.join(os.tmpdir(), 'elocanto_backup_' + Date.now());

  try {
    console.log('[BACKUP] Starting backup process...');
    console.log('[BACKUP] Temp dir:', tempDir);
    
    fs.mkdirSync(tempDir, { recursive: true });

    // Ensure MongoDB is connected (rely on main app connection)
    if (mongoose.connection.readyState !== 1) {
      console.log('[BACKUP] MongoDB not connected (state:', mongoose.connection.readyState, '). waiting...');
      const start = Date.now();
      while (mongoose.connection.readyState !== 1 && Date.now() - start < 10000) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection is not ready.');
      }
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database object not available');
    }

    console.log('[BACKUP] Building URL lookups...');
    const SITE_URL = process.env.SITE_URL || 'https://pk.elocanto.com';
    
    // Fetch critical collections for mapping
    const [rawCats, rawSubs, rawCities] = await Promise.all([
      db.collection('categories').find({}).project({ slug: 1 }).toArray(),
      db.collection('subcategories').find({}).project({ slug: 1, category: 1 }).toArray(),
      db.collection('cities').find({}).project({ slug: 1 }).toArray()
    ]).catch(err => {
      console.warn('[BACKUP] URL lookup pre-cache failed:', err.message);
      return [[], [], []];
    });

    const catMap = new Map(rawCats.map(c => [c._id.toString(), c.slug]));
    const subMap = new Map(rawSubs.map(s => [s._id.toString(), { slug: s.slug, catSlug: catMap.get(s.category?.toString()) }]));
    const cityMap = new Map(rawCities.map(c => [c._id.toString(), c.slug]));

    console.log('[BACKUP] Fetching collections...');
    const collections = await db.listCollections().toArray();
    const backupData = {};
    let totalDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.') || colName === 'fs.files' || colName === 'fs.chunks') continue;
      
      try {
        console.log(`[BACKUP] Collecting: ${colName}`);
        const collection = db.collection(colName);
        let documents = await collection.find({}).toArray();

        // 2. Inject context-aware website links
        if (colName === 'ads') {
          documents = documents.map(doc => ({ 
            ...doc, 
            website_link: `${SITE_URL}/ads/${doc.slug || doc._id}`,
            full_image_links: (doc.images || []).map(img => {
              if (img.startsWith('http')) return img;
              return `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
            })
          }));
        } else if (colName === 'categories') {
          documents = documents.map(doc => ({ ...doc, website_link: `${SITE_URL}/${doc.slug || doc._id}` }));
        } else if (colName === 'subcategories') {
          documents = documents.map(doc => {
            const catSlug = catMap.get(doc.category?.toString());
            return { ...doc, website_link: catSlug ? `${SITE_URL}/${catSlug}/${doc.slug}` : `${SITE_URL}/${doc.slug}` };
          });
        } else if (colName === 'subsubcategories') {
          documents = documents.map(doc => {
            const subInfo = subMap.get(doc.subcategory?.toString());
            return { ...doc, website_link: subInfo?.catSlug ? `${SITE_URL}/${subInfo.catSlug}/${subInfo.slug}/${doc.slug}` : `${SITE_URL}/${doc.slug}` };
          });
        } else if (colName === 'cities') {
          documents = documents.map(doc => ({ ...doc, website_link: `${SITE_URL}/cities/${doc.slug || doc._id}` }));
        } else if (colName === 'areas') {
          documents = documents.map(doc => {
            const citySlug = cityMap.get(doc.city?.toString());
            return { ...doc, website_link: citySlug ? `${SITE_URL}/cities/${citySlug}/areas/${doc.slug}` : `${SITE_URL}/areas/${doc.slug}` };
          });
        } else if (colName === 'hotels') {
          documents = documents.map(doc => {
            const citySlug = cityMap.get(doc.city?.toString());
            return { ...doc, website_link: citySlug ? `${SITE_URL}/cities/${citySlug}/hotels/${doc.slug}` : `${SITE_URL}/hotels/${doc.slug}` };
          });
        }

        backupData[colName] = documents;
        totalDocs += documents.length;
      } catch (err) {
        console.error(`[BACKUP] Warning on ${colName}:`, err.message);
      }
    }

    const dataFile = path.join(tempDir, 'data.json');
    fs.writeFileSync(dataFile, JSON.stringify(backupData, null, 2));
    console.log(`[BACKUP] Collected ${totalDocs} docs`);

    const archivePath = path.join(BACKUP_DIR, `${backupName}.zip`);
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    console.log('[BACKUP] Creating archive...');
    
    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', reject);
    });

    archive.pipe(output);

    // Add data file
    archive.file(dataFile, { name: 'data.json' });

    // Add uploads
    if (includeUploads && fs.existsSync(UPLOADS_DIR)) {
      console.log('[BACKUP] Adding uploads directory...');
      archive.directory(UPLOADS_DIR, 'uploads', (data) => {
        // Exclude temp and cache
        if (data.name.includes('.temp') || data.name.includes('.cache')) return false;
        return data;
      });
    }

    await archive.finalize();
    await archivePromise;

    const stats = fs.statSync(archivePath);
    const size = stats.size;

    console.log(`[BACKUP] Archive created: ${size} bytes`);

    // Clean up temp dir after a short delay
    setTimeout(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('[BACKUP] Temp cleared');
      } catch (e) {
        console.warn('[BACKUP] Cleanup pending:', e.message);
      }
    }, 2000);

    cleanupOldBackups(BACKUP_DIR, retentionDays);

    return {
      success: true,
      archive: archivePath,
      size,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[BACKUP] Fatal:', error.message);
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    throw error;
  }
};

function copyDirRecursive(src, dest, exclude = []) {
  // Kept for manual copy if needed, but archiver.directory is preferred
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  try {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (exclude.some(e => srcPath.includes(e))) continue;
      if (entry.isDirectory()) copyDirRecursive(srcPath, destPath, exclude);
      else fs.copyFileSync(srcPath, destPath);
    }
  } catch (err) { console.error('[BACKUP] Copy error:', err.message); }
}

function cleanupOldBackups(dir, retentionDays) {
  if (!fs.existsSync(dir)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.zip')) continue;
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < cutoff) {
        fs.unlinkSync(filePath);
        console.log(`[BACKUP] Deleted old backup: ${file}`);
      }
    }
  } catch (err) {
    console.error('[BACKUP] Cleanup error:', err.message);
  }
}

export const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  try {
    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch (err) {
    console.error('[BACKUP] List error:', err.message);
    return [];
  }
};

export const deleteBackup = (backupName) => {
  try {
    const filePath = path.join(BACKUP_DIR, backupName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[BACKUP] Deleted: ${filePath}`);
    }
  } catch (err) {
    console.error('[BACKUP] Delete error:', err.message);
  }
};

export const restoreBackup = async (backupFile) => {
  let filePath = backupFile;
  if (!fs.existsSync(backupFile)) {
    filePath = path.join(BACKUP_DIR, backupFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
  }

  console.log('[BACKUP] Starting restore from:', filePath);

  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(filePath);
    const tempDir = path.join(BACKUP_DIR, 'restore_temp');
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    zip.extractAllTo(tempDir, true);

    const dataFile = path.join(tempDir, 'data.json');
    if (!fs.existsSync(dataFile)) {
      throw new Error('Invalid backup: data.json not found');
    }

    const backupData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    const dbName = mongoose.connection.db.databaseName;
    const conn = mongoose.connection.useDb(dbName);

    console.log(`[BACKUP] Restoring to database: ${dbName}`);

    // Helper to convert strings back to ObjectIds and Dates where needed
    const convertTypes = (doc) => {
      const processed = { ...doc };
      for (const [key, value] of Object.entries(processed)) {
        if (!value) continue;

        // Convert 24-char hex strings to ObjectIds for known ID fields
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
          if (key === '_id' || key.toLowerCase().endsWith('id') || ['seller', 'category', 'subcategory', 'subsubcategory', 'area', 'hotel'].includes(key)) {
            try { processed[key] = new mongoose.Types.ObjectId(value); } catch (e) {}
          }
        }
        
        // Convert ISO date strings to Date objects
        if (typeof value === 'string' && key.toLowerCase().endsWith('at') && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          try { processed[key] = new Date(value); } catch (e) {}
        }
      }
      return processed;
    };

    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (collectionName === 'uploads' || collectionName === 'website_links') continue;
      
      try {
        const collection = conn.collection(collectionName);
        console.log(`[BACKUP] Cleaning ${collectionName}...`);
        await collection.deleteMany({});
        
        if (documents.length > 0) {
          const processedDocs = documents.map(doc => {
            // Remove website_link and full_image_links as they are virtual/derived
            const { website_link, full_image_links, ...rest } = doc;
            return convertTypes(rest);
          });
          
          await collection.insertMany(processedDocs);
        }
        console.log(`[BACKUP] Restored ${documents.length} docs to ${collectionName}`);
      } catch (err) {
        console.error(`[BACKUP] Failed to restore ${collectionName}:`, err.message);
      }
    }

    const uploadsBackup = path.join(tempDir, 'uploads');
    if (fs.existsSync(uploadsBackup)) {
      copyDirRecursive(uploadsBackup, UPLOADS_DIR);
      console.log('[BACKUP] Uploads restored');
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('[BACKUP] Restore completed!');
  } catch (err) {
    console.error('[BACKUP] Restore error:', err.message);
    throw err;
  }
};
