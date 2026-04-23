import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const WATERMARK_PATH = path.join(process.cwd(), 'assets', 'watermark.png');

export const WATERMARK_POSITION = {
  CENTER: 'center',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
};

const DEFAULT_OPTIONS = {
  position: WATERMARK_POSITION.CENTER,
  watermarkWidth: 400, // Increased as requested
  opacity: 0.8,
  padding: 0,
};

export const addWatermark = async (inputPath, outputPath, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const watermarkExists = fs.existsSync(WATERMARK_PATH);
  let compositeOptions;

  if (watermarkExists) {
    const metadata = await sharp(inputPath).metadata();
    const imageWidth = metadata.width || 1200;
    const imageHeight = metadata.height || 800;

    const targetWmWidth = Math.min(opts.watermarkWidth, Math.floor(imageWidth * 0.6));
    
    // Scale logo
    const logoBuffer = await sharp(WATERMARK_PATH)
      .resize({ width: targetWmWidth, withoutEnlargement: true })
      .ensureAlpha()
      .toBuffer();

    const logoMeta = await sharp(logoBuffer).metadata();
    const lWidth = logoMeta.width || targetWmWidth;
    const lHeight = logoMeta.height || 100;

    // Composite logo directly onto image (no dark background strip)
    compositeOptions = {
      input: logoBuffer,
      left: Math.max(0, Math.floor((imageWidth - lWidth) / 2)),
      top: Math.max(0, Math.floor((imageHeight - lHeight) / 2)),
    };

  } else {
    // Fallback to text watermark
    const text = opts.text || await getSiteName();
    const metadata = await sharp(inputPath).metadata();
    const fontSize = Math.max(16, Math.floor(metadata.width / 35));
    const textBuffer = await createTextWatermark(text, fontSize, metadata.width || 1200);

    compositeOptions = {
      input: textBuffer,
      gravity: 'southeast',
    };
  }

  // Optimize and Save with SEO Obfuscation
  // 1. Subtle modulation (brightness/saturation) to change file signature
  // 2. Tiny blur to soften pixels
  // 3. 0.1 degree rotation to re-sample the pixel grid (unique fingerprint)
  const outputBuffer = await sharp(inputPath)
    .withMetadata()
    .modulate({
      brightness: 1.02, 
      saturation: 1.05
    })
    .blur(0.5)
    .rotate(0.1, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite([compositeOptions])
    .webp({ quality: 80, effort: 6 }) 
    .toBuffer();

  // Ensure output directory exists (Final check)
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    console.log(`[WATERMARK] Creating missing output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[WATERMARK] Writing final image to: ${outputPath}`);
  await fs.promises.writeFile(outputPath, outputBuffer);

  return outputPath;
};

const getSiteName = () => {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.siteName || 'MarketX';
    }
  } catch {}
  return 'MarketX';
};

const createTextWatermark = async (text, fontSize, imageWidth) => {
  const padding = 20;
  const textLength = text.length * fontSize * 0.6;
  const boxWidth = Math.min(textLength + padding * 2, imageWidth * 0.4);
  const boxHeight = fontSize + padding;

  return sharp({
    create: {
      width: Math.ceil(boxWidth),
      height: Math.ceil(boxHeight),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.5 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg>
            <style>
              text { fill: white; font-size: ${fontSize}px; font-family: Arial, sans-serif; font-weight: bold; }
            </style>
            <text x="50%" y="50%" text-anchor="middle" dy=".35em">${text}</text>
          </svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
};

const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
  return dest;
};

export const addWatermarkToBuffer = async (imageBuffer, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Empty buffer provided');
  }

  const watermarkExists = fs.existsSync(WATERMARK_PATH);
  let compositeOptions;

  if (watermarkExists) {
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width || 1200;
    const imageHeight = metadata.height || 800;

    const targetWmWidth = Math.min(opts.watermarkWidth, Math.floor(imageWidth * 0.6));

    const logoBuffer = await sharp(WATERMARK_PATH)
      .resize({ width: targetWmWidth, withoutEnlargement: true })
      .ensureAlpha()
      .toBuffer();

    const logoMeta = await sharp(logoBuffer).metadata();
    const lWidth = logoMeta.width || targetWmWidth;
    const lHeight = logoMeta.height || 100;

    // Composite logo directly onto image (no dark background strip)
    compositeOptions = {
      input: logoBuffer,
      left: Math.max(0, Math.floor((imageWidth - lWidth) / 2)),
      top: Math.max(0, Math.floor((imageHeight - lHeight) / 2)),
    };

  } else {

    const text = opts.text || getSiteName();
    const metadata = await sharp(imageBuffer).metadata();
    const fontSize = Math.max(16, Math.floor(metadata.width / 40));

    const textBuffer = await createTextWatermark(text, fontSize, metadata.width || 1200);

    compositeOptions = {
      input: textBuffer,
      gravity: 'southeast',
    };
  }

  // SEO Obfuscation & Final watermark
  return sharp(imageBuffer)
    .withMetadata()
    .modulate({
      brightness: 1.01,
      saturation: 1.03
    })
    .blur(0.5)
    .rotate(0.05, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite([compositeOptions])
    .webp({ quality: 85 })
    .toBuffer();
};
