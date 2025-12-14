import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const fileType = file.fieldname; // 'poster', 'banner', 'profilePic', etc.
    cb(null, `${userId}_${fileType}_${timestamp}${extension}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'image/avif',     // Added AVIF support
    'image/heic',     // Added HEIC support (iOS photos)
    'image/heif'   // Added HEIF support (iOS photos)
    ];
    console.log('File mimetype:', file.mimetype); // Debug log
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error('Invalid file type:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, WebP, BMP and SVG allowed.`));
    }
  }
});


