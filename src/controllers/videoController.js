const asyncHandler = require('../utils/asyncHandler');
const videoService = require('../services/videoService');

const list = asyncHandler(async (req, res) => {
  const versions = await videoService.listVersions(req.project);
  res.status(200).json({ success: true, data: versions });
});

const create = asyncHandler(async (req, res) => {
  const version = await videoService.createVersion(req.user, req.project, req.body);
  res.status(201).json({ success: true, data: version });
});

const update = asyncHandler(async (req, res) => {
  const version = await videoService.updateVersion(req.user, req.project, req.params.videoId, req.body);
  res.status(200).json({ success: true, data: version });
});

const validate = asyncHandler(async (req, res) => {
  const version = await videoService.validateVersion(req.user, req.project, req.params.videoId);
  res.status(200).json({ success: true, data: version });
});

const remove = asyncHandler(async (req, res) => {
  await videoService.deleteVersion(req.user, req.project, req.params.videoId);
  res.status(200).json({ success: true, message: 'Version supprimée.' });
});

module.exports = { list, create, update, validate, remove };
