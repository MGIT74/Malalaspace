const multer = require('multer');
const ApiError = require('../utils/apiError');
const storageConfig = require('../config/storage');

// Types autorisés d'après le cahier des charges : logos, images, vidéos,
// captures d'écran, audio, PDF, documents, ZIP
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const upload = multer({
  storage: multer.memoryStorage(), // buffer en mémoire, écrit ensuite via storageService (compatible futur provider S3)
  limits: { fileSize: storageConfig.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Type de fichier non autorisé : ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = upload;
