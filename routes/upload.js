import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '../uploads/banners');
const speakerUploadDir = path.join(__dirname, '../uploads/speakers');
const sponsorUploadDir = path.join(__dirname, '../uploads/sponsors');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(speakerUploadDir)) {
  fs.mkdirSync(speakerUploadDir, { recursive: true });
}
if (!fs.existsSync(sponsorUploadDir)) {
  fs.mkdirSync(sponsorUploadDir, { recursive: true });
}

// Configure multer for file storage with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on route path
    const routePath = req.route?.path || req.path || '';
    if (routePath.includes('/sponsor')) {
      cb(null, sponsorUploadDir);
    } else if (routePath.includes('/speaker') || req.body?.type === 'speaker') {
      cb(null, speakerUploadDir);
    } else {
      cb(null, uploadDir); // Default to banners
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   POST /api/upload/banner
// @desc    Upload event banner image
// @access  Private/Admin (you should add auth middleware)
router.post('/banner', upload.single('banner'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate URL path for the uploaded file
    const fileUrl = `/uploads/banners/${req.file.filename}`;

    console.log('✅ Banner uploaded successfully:', req.file.filename);
    console.log('📁 File path:', req.file.path);
    console.log('🔗 Access URL:', fileUrl);

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${fileUrl}`
      }
    });
  } catch (error) {
    console.error('❌ Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner',
      error: error.message
    });
  }
});

// @route   DELETE /api/upload/banner/:filename
// @desc    Delete uploaded banner
// @access  Private/Admin
router.delete('/banner/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log('🗑️ Banner deleted successfully:', filename);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('❌ Banner delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
});

// @route   POST /api/upload/sponsor
// @desc    Upload sponsor logo image
// @access  Private/Admin
router.post('/sponsor', upload.single('sponsorLogo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate URL path for the uploaded file
    const fileUrl = `/uploads/sponsors/${req.file.filename}`;

    console.log('✅ Sponsor logo uploaded successfully:', req.file.filename);
    console.log('📁 File path:', req.file.path);
    console.log('🔗 Access URL:', fileUrl);

    res.status(200).json({
      success: true,
      message: 'Sponsor logo uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${fileUrl}`
      }
    });
  } catch (error) {
    console.error('❌ Sponsor logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload sponsor logo',
      error: error.message
    });
  }
});

// @route   DELETE /api/upload/sponsor/:filename
// @desc    Delete uploaded sponsor logo
// @access  Private/Admin
router.delete('/sponsor/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(sponsorUploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log('🗑️ Sponsor logo deleted successfully:', filename);

    res.status(200).json({
      success: true,
      message: 'Sponsor logo deleted successfully'
    });
  } catch (error) {
    console.error('❌ Sponsor logo delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sponsor logo',
      error: error.message
    });
  }
});

// @route   POST /api/upload
// @desc    Generic upload endpoint for images (banners, speaker photos, etc.)
// @access  Private/Admin
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadType = req.body.type || 'general';
    console.log('📸 Upload type:', uploadType);
    console.log('📁 Original upload path:', req.file.path);

    let finalPath = req.file.path;
    let fileUrl;

    // Move file to correct directory based on type
    if (uploadType === 'speaker-photo') {
      const newPath = path.join(speakerUploadDir, req.file.filename);
      console.log('📁 Moving file to speakers directory:', newPath);
      
      // Move file from banners to speakers directory
      fs.renameSync(req.file.path, newPath);
      finalPath = newPath;
      fileUrl = `/uploads/speakers/${req.file.filename}`;
    } else {
      // File is already in banners directory
      fileUrl = `/uploads/banners/${req.file.filename}`;
    }

    console.log('✅ File uploaded successfully:', req.file.filename);
    console.log('📁 Final file path:', finalPath);
    console.log('🔗 Access URL:', fileUrl);

    res.status(200).json({
      success: true,
      message: `${uploadType === 'speaker-photo' ? 'Speaker photo' : 'Image'} uploaded successfully`,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${fileUrl}`,
        type: uploadType
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up failed upload file');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

export default router;
