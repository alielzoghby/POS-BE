import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {recursive: true});
}

// Enhanced multer configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Create unique filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    cb(null, uniqueFilename);
  }
});

// File filter function for validation
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg', 
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  };

  // Check if file type is allowed
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${Object.values(allowedTypes).join(', ')} files are allowed.`), false);
  }
};

// Enhanced upload middleware with limits and validation
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per request
  }
});

// Multiple file upload option
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files per request
  }
});

// Helper function to get image URL
const getImageUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get('host')}/api/uploads/${filename}` : null;

// Helper function to get multiple image URLs
const getImageUrls = (req, files) => {
  if (!files || files.length === 0) return [];
  return files.map(file => getImageUrl(req, file.filename));
};

// Helper: parse data URI to extract mime and base64 data
const parseDataUri = (dataUri) => {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUri);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
};

// Middleware to handle base64 images in req.body.image or req.body.image_base64
const base64Image = (req, res, next) => {
  try {
    const imageField = req.body?.image;
    const imageBase64Field = req.body?.image_base64;

    // Only process when we are certain it's base64 input:
    // - Prefer explicit image_base64
    // - Or image starting with data:...;base64,
    const isDataUri = typeof imageField === 'string' && /^data:[^;]+;base64,/.test(imageField);
    const hasExplicitBase64 = typeof imageBase64Field === 'string' && imageBase64Field.length > 0;

    // If it's a normal URL or not a string, skip
    const isHttpUrl = typeof imageField === 'string' && /^https?:\/\//i.test(imageField);
    if (!hasExplicitBase64 && !isDataUri) {
      return next();
    }

    const candidate = hasExplicitBase64 ? imageBase64Field : imageField;

    // Determine mime and raw base64
    let mime = 'image/jpeg';
    let base64 = candidate;
    const parsed = parseDataUri(candidate);
    if (parsed) {
      mime = parsed.mime;
      base64 = parsed.base64;
    }

    const allowedTypes = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg', 
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };

    const ext = allowedTypes[mime] || '.jpg';

    // Decode
    let buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      return res.status(400).json({ status: 400, message: 'Invalid base64 image data', data: null });
    }

    // Validate size (max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (buffer.byteLength > maxBytes) {
      return res.status(400).json({ status: 400, message: 'File size too large. Maximum size is 5MB.', data: null });
    }

    // Persist file
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Set final URL on body for controllers
    req.body.image = getImageUrl(req, filename);
    // Remove base64 field to avoid storing huge strings
    if (req.body.image_base64) delete req.body.image_base64;

    return next();
  } catch (err) {
    return next(err);
  }
};

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 1 file allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "image" field name.';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({
      status: 400,
      message: message,
      data: null
    });
  }
  
  // Handle custom file filter errors
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 400,
      message: err.message,
      data: null
    });
  }
  
  next(err);
};

// Static file serving middleware
const router = express.Router();
router.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// Export all the utilities
export default {
  upload,
  uploadMultiple,
  handleMulterError,
  base64Image,
  getImageUrl,
  getImageUrls,
  staticRouter: router
};

// Named exports for convenience
export { 
  upload, 
  uploadMultiple, 
  handleMulterError, 
  base64Image,
  getImageUrl, 
  getImageUrls 
};

