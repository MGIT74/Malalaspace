const multer = require('multer');
const ApiError = require('../utils/apiError');

// Assets du projet : uniquement images, PDF et fichiers vectoriels (pas de vidéo brute —
// les vidéos passent par des liens YouTube/Vimeo/Wistia/Drive dans l'onglet Vidéos).
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml', // vectoriel
  'application/pdf',
  'application/postscript', // .eps / .ai
  'application/illustrator', // .ai (certains navigateurs)
  'application/x-eps',
  'image/x-eps',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo

const upload = multer({
  storage: multer.memoryStorage(), // buffer en mémoire, écrit ensuite via storageService (compatible futur provider S3)
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Type de fichier non autorisé : ${file.mimetype}. Formats acceptés : JPG, PNG, PDF, EPS, SVG/AI.`));
    }
    cb(null, true);
  },
});

module.exports = upload;
