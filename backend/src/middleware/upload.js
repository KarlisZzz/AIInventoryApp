/**
 * Multer Upload Middleware Configuration
 * 
 * Configures file upload middleware with validation for image uploads.
 * Enforces file type, size limits, and generates unique filenames.
 * 
 * @see specs/002-item-ui-enhancements/contracts/POST-items-id-image.md
 */

const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR } = require('../services/fileStorageService');

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: item-{timestamp}-{randomSuffix}.{ext}
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `item-${uniqueSuffix}${ext}`);
  }
});

// File filter for image types only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('FILE_TYPE_INVALID: Only JPG, PNG, and WebP images are allowed'));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB maximum file size
    files: 1                    // Only one file per request
  },
  fileFilter: fileFilter
});

module.exports = upload;
