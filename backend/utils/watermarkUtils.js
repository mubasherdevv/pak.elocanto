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
  position: WATERMARK_POSITION.BOTTOM_RIGHT,
  watermarkWidth: 140, // 120-150px range
  opacity: 0.85,
  padding: 20,
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

    // Dynamic Scaling: Watermark should not exceed 30% of image width
    const targetWmWidth = Math.min(opts.watermarkWidth, Math.floor(imageWidth * 0.3));
    
    // Maintain transparency and resize logo
    const wmBuffer = await sharp(WATERMARK_PATH)
      .resize({ width: targetWmWidth, withoutEnlargement: true })
      .ensureAlpha()
      .toBuffer();

    const wmMeta = await sharp(wmBuffer).metadata();
    const wmWidth = wmMeta.width || opts.watermarkWidth;
    const wmHeight = wmMeta.height || 50;

    let gravity = 'southeast';
    let left = imageWidth - wmWidth - opts.padding;
    let top = imageHeight - wmHeight - opts.padding;

    // Flexible positioning logic
    switch (opts.position) {
      case WATERMARK_POSITION.CENTER:
        left = Math.floor((imageWidth - wmWidth) / 2);
        top = Math.floor((imageHeight - wmHeight) / 2);
        break;
      case WATERMARK_POSITION.TOP_LEFT:
        left = opts.padding;
        top = opts.padding;
        break;
      case WATERMARK_POSITION.TOP_RIGHT:
        left = imageWidth - wmWidth - opts.padding;
        top = opts.padding;
        break;
      case WATERMARK_POSITION.BOTTOM_LEFT:
        left = opts.padding;
        top = imageHeight - wmHeight - opts.padding;
        break;
    }

    compositeOptions = {
      input: wmBuffer,
      left: Math.max(0, left),
      top: Math.max(0, top),
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

  // Optimize and Save
  const outputBuffer = await sharp(inputPath)
    .composite([compositeOptions])
    .webp({ quality: 80, effort: 6 }) // Efficient compression
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

    // Dynamic Scaling: Watermark should not exceed 30% of image width
    const targetWmWidth = Math.min(opts.watermarkWidth, Math.floor(imageWidth * 0.3));

    const wmBuffer = await sharp(WATERMARK_PATH)
      .resize({ width: targetWmWidth, withoutEnlargement: true })
      .ensureAlpha()
      .toBuffer();

    const wmMeta = await sharp(wmBuffer).metadata();
    const wmWidth = wmMeta.width || opts.watermarkWidth;
    const wmHeight = wmMeta.height || 50;

    let left = opts.padding;
    let top = opts.padding;

    switch (opts.position) {
      case WATERMARK_POSITION.CENTER:
        left = Math.floor((imageWidth - wmWidth) / 2);
        top = Math.floor((imageHeight - wmHeight) / 2);
        break;
      case WATERMARK_POSITION.TOP_LEFT:
        left = opts.padding;
        top = opts.padding;
        break;
      case WATERMARK_POSITION.TOP_RIGHT:
        left = imageWidth - wmWidth - opts.padding;
        top = opts.padding;
        break;
      case WATERMARK_POSITION.BOTTOM_LEFT:
        left = opts.padding;
        top = imageHeight - wmHeight - opts.padding;
        break;
      case WATERMARK_POSITION.BOTTOM_RIGHT:
      default:
        left = imageWidth - wmWidth - opts.padding;
        top = imageHeight - wmHeight - opts.padding;
        break;
    }

    compositeOptions = {
      input: wmBuffer,
      left,
      top,
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

  return sharp(imageBuffer)
    .composite([compositeOptions])
    .webp({ quality: 85 })
    .toBuffer();
};
