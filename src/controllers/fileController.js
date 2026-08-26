const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const fileService = require('../services/fileService');

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucun fichier fourni (champ attendu : "file").');
  }
  const file = await fileService.uploadFile(req.user, req.project, req.file, req.body.category);
  res.status(201).json({ success: true, data: file });
});

const list = asyncHandler(async (req, res) => {
  const files = await fileService.listFiles(req.project);
  res.status(200).json({ success: true, data: files });
});

const download = asyncHandler(async (req, res) => {
  const { file, absolutePath } = await fileService.getFileForDownload(req.project, req.params.fileId);
  res.download(absolutePath, file.fileName);
});

const remove = asyncHandler(async (req, res) => {
  await fileService.deleteFile(req.user, req.project, req.params.fileId);
  res.status(200).json({ success: true, message: 'Fichier supprimé.' });
});

module.exports = { upload, list, download, remove };
